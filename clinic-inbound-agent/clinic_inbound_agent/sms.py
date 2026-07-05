from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)


async def send_sms(to_number: str, body: str) -> bool:
    """Send SMS via Twilio REST API. Returns True on success."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    from_number = os.getenv("TWILIO_FROM_NUMBER", "")

    if not all([account_sid, auth_token, from_number]):
        logger.warning("Twilio SMS not configured — skipping SMS to %s", to_number)
        return False

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    try:
        async with httpx.AsyncClient(auth=(account_sid, auth_token), timeout=15.0) as client:
            resp = await client.post(url, data={"To": to_number, "From": from_number, "Body": body})
            if resp.status_code not in (200, 201):
                logger.error("SMS failed HTTP %s: %s", resp.status_code, resp.text)
                return False
            logger.info("SMS sent to=%s sid=%s", to_number, resp.json().get("sid", ""))
            return True
    except Exception as exc:
        logger.error("SMS exception: %s", exc)
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
        f"Complete payment to confirm: {payment_url} (expires in 15 min)"
    )
    return await send_sms(to_number, body)
