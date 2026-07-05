from __future__ import annotations

import os
from dataclasses import dataclass, field


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


def _list_int(name: str, default: list[int]) -> list[int]:
    """Parse comma-separated list of ints from env var."""
    raw = os.getenv(name, "")
    if not raw.strip():
        return default
    try:
        return [int(x.strip()) for x in raw.split(",")]
    except ValueError:
        return default


@dataclass(frozen=True)
class Config:
    clinic_name: str
    working_hours_start: int          # 24h, e.g. 10
    working_hours_end: int            # 24h, e.g. 18
    slot_length_minutes: int          # e.g. 30
    slot_capacity: int                # max concurrent bookings per slot
    scheduling_window_days: int       # only allow booking within next N days
    hold_expiry_minutes: int          # how long a hold lasts before auto-release
    closed_weekdays: list[int]        # 0=Mon … 6=Sun, default [6] (Sunday)
    db_path: str
    booking_fee_paise: int            # amount for Razorpay payment link


def load_config() -> Config:
    return Config(
        clinic_name=_env("CLINIC_NAME", "Sunrise Clinic"),
        working_hours_start=_int("WORKING_HOURS_START", 10),
        working_hours_end=_int("WORKING_HOURS_END", 18),
        slot_length_minutes=_int("SLOT_LENGTH_MINUTES", 30),
        slot_capacity=_int("SLOT_CAPACITY", 5),
        scheduling_window_days=_int("SCHEDULING_WINDOW_DAYS", 14),
        hold_expiry_minutes=_int("HOLD_EXPIRY_MINUTES", 15),
        closed_weekdays=_list_int("CLOSED_WEEKDAYS", [6]),  # Sunday
        db_path=_env("DB_PATH", "clinic.db"),
        booking_fee_paise=_int("BOOKING_FEE_PAISE", 50000),  # ₹500
    )
