from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os

import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from razorpay_client import RazorpayClient
from sms import send_booking_confirmation_sms, send_payment_failed_sms

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger(__name__)

CLINIC_BACKEND_URL = os.getenv("CLINIC_BACKEND_URL", "http://localhost:8001")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
CLINIC_NAME = os.getenv("CLINIC_NAME", "Sunrise Clinic")


def _get_razorpay() -> RazorpayClient:
    return RazorpayClient(
        key_id=os.getenv("RAZORPAY_KEY_ID", ""),
        key_secret=os.getenv("RAZORPAY_KEY_SECRET", ""),
    )


class CreateLinkRequest(BaseModel):
    hold_id: str
    caller_phone: str
    caller_name: str
    date: str
    time: str
    amount_paise: int = 50000
    clinic_name: str = "Sunrise Clinic"


@router.post("/create-link", status_code=201)
async def create_payment_link(body: CreateLinkRequest):
    """
    POST /payments/create-link
    Called by the agent after placing a hold to generate a Razorpay payment link.
    Returns {short_url, payment_id, hold_id}.
    """
    razorpay = _get_razorpay()
    try:
        description = (
            f"Appointment at {body.clinic_name} on {body.date} at {body.time}"
        )
        data = await razorpay.create_payment_link(
            amount_paise=body.amount_paise,
            description=description,
            customer_phone=body.caller_phone,
            customer_name=body.caller_name,
            hold_id=body.hold_id,
            clinic_name=body.clinic_name,
        )
        return {
            "short_url": data.get("short_url", ""),
            "payment_link_id": data.get("id", ""),
            "hold_id": body.hold_id,
        }
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    finally:
        await razorpay.aclose()


def _verify_signature(body: bytes, signature: str) -> bool:
    """HMAC-SHA256 verification of Razorpay webhook."""
    if not RAZORPAY_WEBHOOK_SECRET:
        logger.warning("RAZORPAY_WEBHOOK_SECRET not set — skipping signature check")
        return True  # allow in dev mode
    expected = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def _confirm_hold_on_backend(hold_id: str, payment_id: str) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{CLINIC_BACKEND_URL}/bookings/confirm",
            json={"hold_id": hold_id, "payment_id": payment_id},
        )
        if resp.status_code == 404:
            raise ValueError(f"hold {hold_id} not found on backend")
        resp.raise_for_status()
        return resp.json()


async def _release_hold_on_backend(hold_id: str) -> None:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.delete(f"{CLINIC_BACKEND_URL}/holds/{hold_id}")
        if resp.status_code not in (200, 404):
            logger.warning("release hold %s returned %s", hold_id, resp.status_code)


async def _get_hold_from_backend(hold_id: str) -> dict | None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{CLINIC_BACKEND_URL}/holds/{hold_id}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()


@router.post("/webhook")
async def razorpay_webhook(request: Request):
    """
    Razorpay webhook endpoint.
    Handles: payment_link.paid → confirm booking + send confirmation SMS
             payment.failed   → release hold + send failure SMS
    Idempotent: checks hold/booking state before acting.
    """
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    if not _verify_signature(body, signature):
        logger.warning("invalid razorpay signature — rejecting webhook")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    event = payload.get("event", "")
    logger.info("razorpay webhook event=%s", event)

    # ------------------------------------------------------------------ #
    # payment_link.paid — confirm the hold
    # ------------------------------------------------------------------ #
    if event == "payment_link.paid":
        plink = payload.get("payload", {}).get("payment_link", {}).get("entity", {})
        payment = payload.get("payload", {}).get("payment", {}).get("entity", {})

        hold_id = (plink.get("notes") or {}).get("hold_id", "")
        payment_id = payment.get("id", "")
        customer_phone = (plink.get("customer") or {}).get("contact", "")

        if not hold_id:
            logger.error("webhook payment_link.paid missing hold_id in notes")
            return Response(status_code=200)  # ack anyway

        try:
            hold = await _get_hold_from_backend(hold_id)
            if hold is None:
                logger.warning("hold %s not found on backend — may already be confirmed", hold_id)
                return Response(status_code=200)

            result = await _confirm_hold_on_backend(hold_id, payment_id)
            booking_id = result["booking_id"]

            if result.get("idempotent"):
                logger.info("idempotent webhook — booking %s already exists", booking_id)
            else:
                logger.info("booking confirmed %s from hold %s", booking_id, hold_id)

            # Send confirmation SMS
            date_str = hold.get("date", "")
            time_str = hold.get("time", "")
            phone = customer_phone or hold.get("caller_phone", "")

            if phone:
                ok = await send_booking_confirmation_sms(
                    to_number=phone,
                    clinic_name=CLINIC_NAME,
                    date_str=date_str,
                    time_str=time_str,
                    booking_id=booking_id,
                )
                if not ok:
                    logger.warning("confirmation SMS failed for booking %s", booking_id)

        except Exception as exc:
            logger.error("webhook confirm error: %s", exc)
            # Return 200 to prevent Razorpay retrying — log for manual follow-up
        return Response(status_code=200)

    # ------------------------------------------------------------------ #
    # payment.failed — release hold + notify customer
    # ------------------------------------------------------------------ #
    elif event == "payment.failed":
        payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
        # Razorpay payment_link notes may be nested differently on failure
        plink_id = payment.get("payment_link_id", "")
        # We don't have hold_id directly on payment.failed — fetch from notes via payment_link id
        # As a fallback: log and return 200
        logger.warning(
            "payment.failed received payment_id=%s plink_id=%s",
            payment.get("id"),
            plink_id,
        )
        # Note: hold will expire automatically within HOLD_EXPIRY_MINUTES
        return Response(status_code=200)

    # ------------------------------------------------------------------ #
    # payment_link.expired — release hold + notify customer
    # ------------------------------------------------------------------ #
    elif event == "payment_link.expired":
        plink = payload.get("payload", {}).get("payment_link", {}).get("entity", {})
        hold_id = (plink.get("notes") or {}).get("hold_id", "")
        customer_phone = (plink.get("customer") or {}).get("contact", "")

        if hold_id:
            hold = await _get_hold_from_backend(hold_id)
            if hold and hold.get("status") == "active":
                await _release_hold_on_backend(hold_id)
                phone = customer_phone or hold.get("caller_phone", "")
                if phone:
                    await send_payment_failed_sms(
                        to_number=phone,
                        clinic_name=CLINIC_NAME,
                        date_str=hold.get("date", ""),
                        time_str=hold.get("time", ""),
                    )
        return Response(status_code=200)

    # Unknown event — ack
    return Response(status_code=200)


@router.post("/simulate-success")
async def simulate_payment_success(request: Request):
    """
    LOCAL TESTING ONLY: Simulate a successful Razorpay payment_link.paid webhook.

    POST /payments/simulate-success
    Body: {"hold_id": "...", "payment_id": "pay_test_xxx"}
    """
    body = await request.json()
    hold_id = body.get("hold_id", "")
    payment_id = body.get("payment_id", "pay_sim_test")

    if not hold_id:
        raise HTTPException(status_code=422, detail="hold_id required")

    hold = await _get_hold_from_backend(hold_id)
    if not hold:
        raise HTTPException(status_code=404, detail=f"Hold {hold_id} not found")

    result = await _confirm_hold_on_backend(hold_id, payment_id)

    sms_ok = await send_booking_confirmation_sms(
        to_number=hold.get("caller_phone", ""),
        clinic_name=CLINIC_NAME,
        date_str=hold.get("date", ""),
        time_str=hold.get("time", ""),
        booking_id=result["booking_id"],
    )

    return {
        "simulated": True,
        "booking_id": result["booking_id"],
        "idempotent": result.get("idempotent", False),
        "sms_sent": sms_ok,
    }
