from __future__ import annotations

import logging
from datetime import date as _date, datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator

import db
from config import Config

router = APIRouter(prefix="/holds", tags=["holds"])
logger = logging.getLogger(__name__)


class HoldRequest(BaseModel):
    date: str           # YYYY-MM-DD
    time: str           # HH:MM
    caller_phone: str
    caller_name: str

    @field_validator("caller_phone")
    @classmethod
    def _validate_phone(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("caller_phone is required")
        return cleaned

    @field_validator("caller_name")
    @classmethod
    def _validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("caller_name is required")
        return cleaned


def _get_cfg(request: Request) -> Config:
    return request.app.state.cfg


def _validate_slot(date_str: str, time_str: str, cfg: Config) -> None:
    """Validate date/time is bookable (not past, not closed day, within window)."""
    try:
        d = _date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid date: {date_str!r}")

    today = datetime.now(timezone.utc).date()
    if d < today:
        raise HTTPException(status_code=422, detail="Cannot book slots in the past.")

    if d.weekday() in cfg.closed_weekdays:
        raise HTTPException(
            status_code=422,
            detail=f"Clinic is closed on that day. Please pick a working day.",
        )

    max_date = today + timedelta(days=cfg.scheduling_window_days)
    if d > max_date:
        raise HTTPException(
            status_code=422,
            detail=f"Date is beyond the {cfg.scheduling_window_days}-day scheduling window.",
        )

    # Validate time format
    try:
        h, m = time_str.split(":")
        assert 0 <= int(h) < 24 and 0 <= int(m) < 60
    except Exception:
        raise HTTPException(status_code=422, detail=f"Invalid time format: {time_str!r}. Use HH:MM.")


@router.post("", status_code=201)
async def create_hold(body: HoldRequest, request: Request):
    """
    POST /holds
    Create a temporary hold on a slot. Returns hold_id and expiry.
    409 if slot is fully booked.
    """
    cfg = _get_cfg(request)
    _validate_slot(body.date, body.time, cfg)

    try:
        result = await db.create_hold(
            body.date,
            body.time,
            body.caller_phone,
            body.caller_name,
            cfg,
        )
    except ValueError as exc:
        msg = str(exc)
        if "fully booked" in msg:
            raise HTTPException(status_code=409, detail=msg)
        if "duplicate" in msg:
            raise HTTPException(status_code=409, detail=msg)
        raise HTTPException(status_code=422, detail=msg)

    return {
        "hold_id": result["hold_id"],
        "expires_at": result["expires_at"],
        "date": body.date,
        "time": body.time,
        "caller_phone": body.caller_phone,
        "caller_name": body.caller_name,
    }


@router.delete("/{hold_id}", status_code=200)
async def release_hold(hold_id: str):
    """
    DELETE /holds/{hold_id}
    Explicitly release a hold (e.g. caller changed their mind).
    """
    released = await db.release_hold(hold_id)
    if not released:
        raise HTTPException(status_code=404, detail=f"Hold {hold_id!r} not found or already released.")
    return {"hold_id": hold_id, "status": "released"}


@router.get("/{hold_id}")
async def get_hold(hold_id: str):
    hold = await db.get_hold(hold_id)
    if not hold:
        raise HTTPException(status_code=404, detail=f"Hold {hold_id!r} not found.")
    return hold
