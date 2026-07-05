from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import httpx

logger = logging.getLogger(__name__)


@dataclass
class SlotInfo:
    time: str
    available: int
    capacity: int
    active_holds: int
    confirmed_bookings: int


@dataclass
class HoldResult:
    hold_id: str
    expires_at: str
    date: str
    time: str
    caller_phone: str
    caller_name: str


class ClinicAPIClient:
    """Wraps clinic-backend REST API calls for use by the agent."""

    def __init__(self, base_url: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=10.0)

    async def check_availability(self, date_str: str) -> list[SlotInfo]:
        """
        GET /availability?date=YYYY-MM-DD
        Returns list of SlotInfo objects, only those with available > 0.
        """
        try:
            resp = await self._client.get(
                f"{self._base_url}/availability", params={"date": date_str}
            )
            if resp.status_code == 422:
                data = resp.json()
                raise ValueError(data.get("detail", f"Invalid date: {date_str}"))
            resp.raise_for_status()
            data = resp.json()
            slots = [
                SlotInfo(
                    time=s["time"],
                    available=s["available"],
                    capacity=s["capacity"],
                    active_holds=s["active_holds"],
                    confirmed_bookings=s["confirmed_bookings"],
                )
                for s in data.get("slots", [])
            ]
            return slots
        except httpx.HTTPError as exc:
            logger.error("check_availability HTTP error: %s", exc)
            raise RuntimeError(f"Clinic booking service unavailable: {exc}")

    async def hold_slot(
        self,
        date_str: str,
        time_str: str,
        caller_phone: str,
        caller_name: str,
    ) -> HoldResult:
        """
        POST /holds
        Returns HoldResult on success.
        Raises ValueError with user-friendly message on 409 (full/duplicate).
        """
        try:
            resp = await self._client.post(
                f"{self._base_url}/holds",
                json={
                    "date": date_str,
                    "time": time_str,
                    "caller_phone": caller_phone,
                    "caller_name": caller_name,
                },
            )
            if resp.status_code == 409:
                detail = resp.json().get("detail", "Slot is fully booked.")
                raise ValueError(detail)
            if resp.status_code == 422:
                detail = resp.json().get("detail", "Invalid slot.")
                raise ValueError(detail)
            resp.raise_for_status()
            data = resp.json()
            return HoldResult(
                hold_id=data["hold_id"],
                expires_at=data["expires_at"],
                date=data["date"],
                time=data["time"],
                caller_phone=data["caller_phone"],
                caller_name=data["caller_name"],
            )
        except ValueError:
            raise
        except httpx.HTTPError as exc:
            logger.error("hold_slot HTTP error: %s", exc)
            raise RuntimeError(f"Clinic booking service unavailable: {exc}")

    async def release_hold(self, hold_id: str) -> None:
        """DELETE /holds/{hold_id} — silently ignores 404."""
        try:
            resp = await self._client.delete(f"{self._base_url}/holds/{hold_id}")
            if resp.status_code not in (200, 404):
                logger.warning("release_hold %s returned %s", hold_id, resp.status_code)
        except httpx.HTTPError as exc:
            logger.warning("release_hold HTTP error: %s", exc)

    async def aclose(self) -> None:
        await self._client.aclose()
