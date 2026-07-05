from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)


async def send_sms(to_number: str, body: str) -> bool:
    """
    Send an SMS via Twilio REST API.
    Returns True on success, False on failure (so caller can surface to user).
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    from_number = os.getenv("TWILIO_FROM_NUMBER", "")

    if not all([account_sid, auth_token, from_number]):
        logger.warning("Twilio SMS not configured — skipping SMS to %s", to_number)
        return False

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    payload = {
        "To": to_number,
        "From": from_number,
        "Body": body,
    }

    try:
        async with httpx.AsyncClient(auth=(account_sid, auth_token), timeout=15.0) as client:
            response = await client.post(url, data=payload)
            if response.status_code not in (200, 201):
                logger.error(
                    "SMS send failed HTTP %s: %s", response.status_code, response.text
                )
                return False
            sid = response.json().get("sid", "")
            logger.info("SMS sent to=%s sid=%s", to_number, sid)
            return True
    except Exception as exc:
        logger.error("SMS send exception: %s", exc)
        return False


async def send_payment_link_sms(
    to_number: str,
    payment_url: str,
    clinic_name: str,
    date_str: str,
    time_str: str,
) -> bool:
    body = (
        f"Hi! Your appointment at {clinic_name} is reserved for {date_str} at {time_str}. "
        f"Please complete payment to confirm your slot: {payment_url} "
        f"(Link expires in 15 minutes.)"
    )
    return await send_sms(to_number, body)


async def send_booking_confirmation_sms(
    to_number: str,
    clinic_name: str,
    date_str: str,
    time_str: str,
    booking_id: str,
) -> bool:
    body = (
        f"✅ Booking Confirmed! You're all set at {clinic_name} on {date_str} at {time_str}. "
        f"Ref: {booking_id[:8].upper()}. See you then!"
    )
    return await send_sms(to_number, body)


async def send_payment_failed_sms(
    to_number: str,
    clinic_name: str,
    date_str: str,
    time_str: str,
) -> bool:
    body = (
        f"Your appointment hold at {clinic_name} for {date_str} at {time_str} has been released "
        f"as payment was not completed. Please call us to book again."
    )
    return await send_sms(to_number, body)
