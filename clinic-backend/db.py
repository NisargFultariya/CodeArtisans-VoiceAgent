from __future__ import annotations

import asyncio
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any

import aiosqlite

from config import Config

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

_DDL = """
CREATE TABLE IF NOT EXISTS slots (
    date        TEXT NOT NULL,
    time        TEXT NOT NULL,
    capacity    INTEGER NOT NULL,
    PRIMARY KEY (date, time)
);

CREATE TABLE IF NOT EXISTS holds (
    hold_id      TEXT PRIMARY KEY,
    date         TEXT NOT NULL,
    time         TEXT NOT NULL,
    caller_phone TEXT NOT NULL,
    caller_name  TEXT NOT NULL,
    expires_at   TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'active'   -- active | confirmed | released | expired
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id   TEXT PRIMARY KEY,
    hold_id      TEXT NOT NULL UNIQUE,
    date         TEXT NOT NULL,
    time         TEXT NOT NULL,
    caller_phone TEXT NOT NULL,
    caller_name  TEXT NOT NULL,
    payment_id   TEXT,
    created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_holds_date_time   ON holds(date, time, status);
CREATE INDEX IF NOT EXISTS idx_holds_phone       ON holds(caller_phone, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date     ON bookings(date, time);
CREATE INDEX IF NOT EXISTS idx_bookings_phone    ON bookings(caller_phone);
"""

_DB_PATH: str = "clinic.db"
_cfg: Config | None = None


def init_db_config(cfg: Config) -> None:
    global _DB_PATH, _cfg
    _DB_PATH = cfg.db_path
    _cfg = cfg


@asynccontextmanager
async def _connect():
    """Async context manager that yields a configured aiosqlite connection.

    isolation_level=None → disables aiosqlite's implicit transaction management
    so that manual BEGIN IMMEDIATE / COMMIT / ROLLBACK work correctly, and
    simple queries can use explicit db.commit() after writes.
    """
    async with aiosqlite.connect(_DB_PATH, isolation_level=None) as conn:
        conn.row_factory = aiosqlite.Row
        await conn.execute("PRAGMA journal_mode=WAL")
        await conn.execute("PRAGMA foreign_keys=ON")
        yield conn


async def create_tables() -> None:
    async with _connect() as db:
        await db.executescript(_DDL)
        await db.commit()
    logger.info("DB tables initialised at %s", _DB_PATH)


# ---------------------------------------------------------------------------
# Slot seeding helpers
# ---------------------------------------------------------------------------

def _slot_times(cfg: Config) -> list[str]:
    """Generate HH:MM slot start times for working hours."""
    times = []
    current = cfg.working_hours_start * 60  # minutes from midnight
    end = cfg.working_hours_end * 60
    while current + cfg.slot_length_minutes <= end:
        h, m = divmod(current, 60)
        times.append(f"{h:02d}:{m:02d}")
        current += cfg.slot_length_minutes
    return times


async def ensure_slots_for_date(date_str: str, cfg: Config) -> None:
    """Insert slot rows for a date if they don't exist yet."""
    times = _slot_times(cfg)
    async with _connect() as db:
        for t in times:
            await db.execute(
                "INSERT OR IGNORE INTO slots(date, time, capacity) VALUES (?,?,?)",
                (date_str, t, cfg.slot_capacity),
            )
        await db.commit()


# ---------------------------------------------------------------------------
# Availability
# ---------------------------------------------------------------------------

async def get_availability(date_str: str, cfg: Config) -> list[dict[str, Any]]:
    """Return list of {time, capacity, active_holds, confirmed_bookings, available} for date."""
    await ensure_slots_for_date(date_str, cfg)
    now_utc = _now_iso()

    async with _connect() as db:
        # Active holds (not expired, not released/confirmed)
        holds_q = await db.execute(
            """
            SELECT time, COUNT(*) as cnt
            FROM holds
            WHERE date=? AND status='active' AND expires_at > ?
            GROUP BY time
            """,
            (date_str, now_utc),
        )
        holds_by_time: dict[str, int] = {r["time"]: r["cnt"] for r in await holds_q.fetchall()}

        # Confirmed bookings
        bookings_q = await db.execute(
            """
            SELECT time, COUNT(*) as cnt
            FROM bookings
            WHERE date=?
            GROUP BY time
            """,
            (date_str,),
        )
        bookings_by_time: dict[str, int] = {r["time"]: r["cnt"] for r in await bookings_q.fetchall()}

        slots_q = await db.execute(
            "SELECT date, time, capacity FROM slots WHERE date=? ORDER BY time",
            (date_str,),
        )
        rows = await slots_q.fetchall()

    result = []
    for row in rows:
        t = row["time"]
        cap = row["capacity"]
        h = holds_by_time.get(t, 0)
        b = bookings_by_time.get(t, 0)
        avail = max(0, cap - h - b)
        result.append(
            {
                "time": t,
                "capacity": cap,
                "active_holds": h,
                "confirmed_bookings": b,
                "available": avail,
            }
        )
    return result


# ---------------------------------------------------------------------------
# Holds
# ---------------------------------------------------------------------------

async def create_hold(
    date_str: str,
    time_str: str,
    caller_phone: str,
    caller_name: str,
    cfg: Config,
) -> dict[str, Any]:
    """
    Atomically check capacity and create a hold.
    Raises ValueError if slot is full or caller already has active hold/booking.
    """
    await ensure_slots_for_date(date_str, cfg)
    hold_id = str(uuid.uuid4())
    expires_at = (
        datetime.now(timezone.utc) + timedelta(minutes=cfg.hold_expiry_minutes)
    ).isoformat()
    now_utc = _now_iso()

    async with _connect() as db:
        # BEGIN IMMEDIATE — serialises concurrent writers
        await db.execute("BEGIN IMMEDIATE")

        # --- Duplicate check: same phone, active hold or booking on same slot ---
        dup_hold = await db.execute(
            "SELECT hold_id FROM holds WHERE caller_phone=? AND date=? AND time=? AND status='active' AND expires_at > ?",
            (caller_phone, date_str, time_str, now_utc),
        )
        if await dup_hold.fetchone():
            await db.execute("ROLLBACK")
            raise ValueError("duplicate: caller already has an active hold for this slot")

        dup_booking = await db.execute(
            "SELECT booking_id FROM bookings WHERE caller_phone=? AND date=? AND time=?",
            (caller_phone, date_str, time_str),
        )
        if await dup_booking.fetchone():
            await db.execute("ROLLBACK")
            raise ValueError("duplicate: caller already has a confirmed booking for this slot")

        # --- Capacity check ---
        cap_row = await db.execute(
            "SELECT capacity FROM slots WHERE date=? AND time=?",
            (date_str, time_str),
        )
        slot = await cap_row.fetchone()
        if not slot:
            await db.execute("ROLLBACK")
            raise ValueError(f"slot {date_str} {time_str} does not exist")

        capacity = slot["capacity"]

        hold_cnt = await db.execute(
            "SELECT COUNT(*) as cnt FROM holds WHERE date=? AND time=? AND status='active' AND expires_at > ?",
            (date_str, time_str, now_utc),
        )
        h = (await hold_cnt.fetchone())["cnt"]

        book_cnt = await db.execute(
            "SELECT COUNT(*) as cnt FROM bookings WHERE date=? AND time=?",
            (date_str, time_str),
        )
        b = (await book_cnt.fetchone())["cnt"]

        if h + b >= capacity:
            await db.execute("ROLLBACK")
            raise ValueError(f"slot {date_str} {time_str} is fully booked")

        # --- Insert hold ---
        await db.execute(
            """
            INSERT INTO holds(hold_id, date, time, caller_phone, caller_name, expires_at, status)
            VALUES (?,?,?,?,?,?,'active')
            """,
            (hold_id, date_str, time_str, caller_phone, caller_name, expires_at),
        )
        await db.execute("COMMIT")

    logger.info("hold created %s for %s %s phone=%s", hold_id, date_str, time_str, caller_phone)
    return {"hold_id": hold_id, "expires_at": expires_at}


async def release_hold(hold_id: str) -> bool:
    """Release a hold. Returns True if found and released."""
    async with _connect() as db:
        cur = await db.execute(
            "UPDATE holds SET status='released' WHERE hold_id=? AND status='active'",
            (hold_id,),
        )
        await db.commit()
        return cur.rowcount > 0


async def get_hold(hold_id: str) -> dict[str, Any] | None:
    async with _connect() as db:
        row = await db.execute(
            "SELECT * FROM holds WHERE hold_id=?", (hold_id,)
        )
        r = await row.fetchone()
        return dict(r) if r else None


# ---------------------------------------------------------------------------
# Bookings (confirm hold → booking)
# ---------------------------------------------------------------------------

async def confirm_hold(hold_id: str, payment_id: str) -> dict[str, Any]:
    """
    Convert a hold into a confirmed booking. Idempotent.
    Raises ValueError if hold not found or already expired/released.
    """
    async with _connect() as db:
        await db.execute("BEGIN IMMEDIATE")

        # Idempotency: check if booking already exists for this hold
        existing = await db.execute(
            "SELECT booking_id FROM bookings WHERE hold_id=?", (hold_id,)
        )
        row = await existing.fetchone()
        if row:
            await db.execute("ROLLBACK")
            return {"booking_id": row["booking_id"], "idempotent": True}

        hold_row = await db.execute(
            "SELECT * FROM holds WHERE hold_id=? AND status='active'", (hold_id,)
        )
        hold = await hold_row.fetchone()
        if not hold:
            await db.execute("ROLLBACK")
            raise ValueError(f"hold {hold_id} not found or no longer active")

        booking_id = str(uuid.uuid4())
        now = _now_iso()

        await db.execute(
            """
            INSERT INTO bookings(booking_id, hold_id, date, time, caller_phone, caller_name, payment_id, created_at)
            VALUES (?,?,?,?,?,?,?,?)
            """,
            (
                booking_id,
                hold_id,
                hold["date"],
                hold["time"],
                hold["caller_phone"],
                hold["caller_name"],
                payment_id,
                now,
            ),
        )
        await db.execute(
            "UPDATE holds SET status='confirmed' WHERE hold_id=?", (hold_id,)
        )
        await db.execute("COMMIT")

    logger.info("booking confirmed %s from hold %s payment=%s", booking_id, hold_id, payment_id)
    return {"booking_id": booking_id, "idempotent": False}


async def get_all_bookings() -> list[dict[str, Any]]:
    async with _connect() as db:
        cur = await db.execute(
            "SELECT * FROM bookings ORDER BY date, time, created_at"
        )
        return [dict(r) for r in await cur.fetchall()]


async def get_all_holds() -> list[dict[str, Any]]:
    async with _connect() as db:
        cur = await db.execute(
            "SELECT * FROM holds ORDER BY expires_at DESC"
        )
        return [dict(r) for r in await cur.fetchall()]


async def get_bookings_summary() -> list[dict[str, Any]]:
    """Aggregate bookings per slot for admin view."""
    async with _connect() as db:
        cur = await db.execute(
            """
            SELECT
                b.date,
                b.time,
                COUNT(*) as total_bookings,
                s.capacity,
                GROUP_CONCAT(b.caller_name, ', ') as patients
            FROM bookings b
            JOIN slots s ON s.date=b.date AND s.time=b.time
            GROUP BY b.date, b.time
            ORDER BY b.date, b.time
            """
        )
        return [dict(r) for r in await cur.fetchall()]


# ---------------------------------------------------------------------------
# Hold expiry background task
# ---------------------------------------------------------------------------

async def expire_stale_holds() -> int:
    """Mark holds past their expiry as 'expired'. Returns count updated."""
    now_utc = _now_iso()
    async with _connect() as db:
        cur = await db.execute(
            "UPDATE holds SET status='expired' WHERE status='active' AND expires_at <= ?",
            (now_utc,),
        )
        await db.commit()
        if cur.rowcount:
            logger.info("expired %d stale holds", cur.rowcount)
        return cur.rowcount


async def run_expiry_loop(interval_seconds: int = 60) -> None:
    """Background task — runs forever, expiring stale holds periodically."""
    while True:
        try:
            await expire_stale_holds()
        except Exception as exc:
            logger.warning("expiry loop error: %s", exc)
        await asyncio.sleep(interval_seconds)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
