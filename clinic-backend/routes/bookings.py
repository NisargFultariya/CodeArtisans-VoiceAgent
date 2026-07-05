from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import db

router = APIRouter(prefix="/bookings", tags=["bookings"])
logger = logging.getLogger(__name__)


class ConfirmRequest(BaseModel):
    hold_id: str
    payment_id: str = ""


@router.post("/confirm", status_code=200)
async def confirm_booking(body: ConfirmRequest):
    """
    POST /bookings/confirm
    Convert a hold into a confirmed booking after payment success.
    Idempotent — calling again with the same hold_id returns the existing booking_id.
    """
    try:
        result = await db.confirm_hold(body.hold_id, body.payment_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    hold = await db.get_hold(body.hold_id)
    return {
        "booking_id": result["booking_id"],
        "idempotent": result["idempotent"],
        "hold_id": body.hold_id,
        "date": hold["date"] if hold else None,
        "time": hold["time"] if hold else None,
        "caller_phone": hold["caller_phone"] if hold else None,
        "caller_name": hold["caller_name"] if hold else None,
    }


@router.get("")
async def list_bookings():
    """GET /bookings — full list of all confirmed bookings (admin/debug use)."""
    return await db.get_all_bookings()
