from __future__ import annotations

import logging
from datetime import date as _date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

import db
from config import Config

router = APIRouter(prefix="/availability", tags=["availability"])
logger = logging.getLogger(__name__)


def _get_cfg(request: Request) -> Config:
    return request.app.state.cfg


def _validate_date(date_str: str, cfg: Config) -> _date:
    """Parse and validate: not Sunday, within scheduling window, not past."""
    try:
        d = _date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid date format: {date_str!r}. Use YYYY-MM-DD.")

    today = datetime.now(timezone.utc).date()

    if d < today:
        raise HTTPException(status_code=422, detail="Cannot check availability for past dates.")

    if d.weekday() in cfg.closed_weekdays:
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        closed = [day_names[w] for w in cfg.closed_weekdays]
        raise HTTPException(
            status_code=422,
            detail=f"The clinic is closed on {', '.join(closed)}. Please choose a different day.",
        )

    max_date = today.replace(day=today.day)
    from datetime import timedelta
    max_date = today + timedelta(days=cfg.scheduling_window_days)
    if d > max_date:
        raise HTTPException(
            status_code=422,
            detail=f"Bookings are only accepted within the next {cfg.scheduling_window_days} days (until {max_date}).",
        )

    return d


@router.get("")
async def get_availability(date: str, request: Request):
    """
    GET /availability?date=YYYY-MM-DD

    Returns list of slots for the given date with remaining capacity.
    Filters out slots whose start time has already passed (for today).
    """
    cfg = _get_cfg(request)
    d = _validate_date(date, cfg)

    slots = await db.get_availability(date, cfg)

    # Filter past slots for today
    today = datetime.now(timezone.utc).date()
    now_time = datetime.now(timezone.utc)
    if d == today:
        from datetime import timedelta
        import pytz
        # Use naive comparison — times are HH:MM in local clinic time
        # For simplicity, filter out slots that started before now (UTC approx)
        current_hhmm = f"{now_time.hour:02d}:{now_time.minute:02d}"
        slots = [s for s in slots if s["time"] > current_hhmm]

    return {
        "date": date,
        "clinic_name": cfg.clinic_name,
        "slots": slots,
    }
