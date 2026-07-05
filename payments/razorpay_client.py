from __future__ import annotations

import hashlib
import hmac
import logging
import os

import httpx

logger = logging.getLogger(__name__)

RAZORPAY_API_BASE = "https://api.razorpay.com/v1"


class RazorpayClient:
    def __init__(self, key_id: str, key_secret: str) -> None:
        self._key_id = key_id
        self._key_secret = key_secret
        self._client = httpx.AsyncClient(
            auth=(key_id, key_secret),
            timeout=30.0,
        )

    async def create_payment_link(
        self,
        *,
        amount_paise: int,
        description: str,
        customer_phone: str,
        customer_name: str,
        hold_id: str,
        clinic_name: str = "Sunrise Clinic",
    ) -> dict:
        """
        Create a Razorpay Payment Link and return the full response dict.
        `short_url` field contains the shareable link.
        """
        # Normalize phone — Razorpay requires E.164 (e.g. +919876543210)
        phone = _normalize_phone(customer_phone)

        payload = {
            "amount": amount_paise,
            "currency": "INR",
            "description": description,
            "customer": {
                "name": customer_name,
                "contact": phone,
            },
            "notify": {
                "sms": True,
                "email": False,
            },
            "reminder_enable": True,
            "notes": {
                "hold_id": hold_id,
                "clinic": clinic_name,
            },
            "callback_url": os.getenv("RAZORPAY_CALLBACK_URL", ""),
            "callback_method": "get",
        }

        response = await self._client.post(
            f"{RAZORPAY_API_BASE}/payment_links",
            json=payload,
        )
        if response.status_code not in (200, 201):
            raise RuntimeError(
                f"Razorpay create_payment_link failed: HTTP {response.status_code}: {response.text}"
            )
        data = response.json()
        logger.info(
            "razorpay payment link created id=%s hold=%s short_url=%s",
            data.get("id"),
            hold_id,
            data.get("short_url"),
        )
        return data

    def verify_webhook_signature(
        self, body: bytes, signature: str, webhook_secret: str
    ) -> bool:
        """Verify Razorpay webhook HMAC-SHA256 signature."""
        expected = hmac.new(
            webhook_secret.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def aclose(self) -> None:
        await self._client.aclose()


def _normalize_phone(phone: str) -> str:
    """Best-effort E.164 normalization for Indian numbers."""
    p = phone.strip().replace(" ", "").replace("-", "")
    if p.startswith("+"):
        return p
    if p.startswith("0"):
        p = p[1:]
    if len(p) == 10:
        return f"+91{p}"
    return p
