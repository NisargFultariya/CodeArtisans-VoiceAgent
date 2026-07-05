from __future__ import annotations

import asyncio
import json
import logging
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

_LOG_PATH = Path("call_logs.db")
_lock = threading.Lock()


def _init_db() -> None:
    with sqlite3.connect(_LOG_PATH) as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS call_logs (
            call_id      TEXT PRIMARY KEY,
            room_name    TEXT,
            caller_phone TEXT,
            transcript   TEXT,     -- JSON array of {role, text}
            hold_id      TEXT,
            booking_id   TEXT,
            outcome      TEXT,
            created_at   TEXT
        )
        """)
        conn.commit()


_init_db()


def log_call(
    *,
    room_name: str,
    caller_phone: str,
    transcript: list[dict],
    hold_id: str | None = None,
    booking_id: str | None = None,
    outcome: str = "unknown",
) -> str:
    """Append a call log entry. Returns call_id."""
    call_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with _lock, sqlite3.connect(_LOG_PATH) as conn:
        conn.execute(
            """
            INSERT INTO call_logs(call_id, room_name, caller_phone, transcript, hold_id, booking_id, outcome, created_at)
            VALUES (?,?,?,?,?,?,?,?)
            """,
            (
                call_id,
                room_name,
                caller_phone,
                json.dumps(transcript),
                hold_id,
                booking_id,
                outcome,
                now,
            ),
        )
        conn.commit()
    logger.info("call logged %s room=%s outcome=%s", call_id, room_name, outcome)
    return call_id
