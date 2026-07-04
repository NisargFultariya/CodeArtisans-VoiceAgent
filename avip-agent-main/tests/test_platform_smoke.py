from __future__ import annotations

import os
import time

import httpx
import pytest


def _api_base() -> str:
    return os.getenv("AVIP_API_URL", "http://127.0.0.1:3000").rstrip("/")


def _internal_secret() -> str:
    return os.getenv(
        "AVIP_INTERNAL_SIGNAL_SECRET",
        os.getenv("AVIP_INTERNAL_SECRET", "dev-internal-secret-change-me"),
    )


def _api_reachable() -> bool:
    try:
        response = httpx.get(f"{_api_base()}/health", timeout=2.0)
        return response.status_code == 200
    except httpx.HTTPError:
        return False


def _poll_call_status(
    *,
    shop: str,
    order_id: str,
    timeout_seconds: float = 120.0,
) -> dict:
    deadline = time.monotonic() + timeout_seconds
    headers = {"x-avip-internal-secret": _internal_secret()}
    while time.monotonic() < deadline:
        response = httpx.get(
            f"{_api_base()}/internal/calls",
            params={"shopDomain": shop, "limit": 50},
            headers=headers,
            timeout=10.0,
        )
        if response.status_code == 200:
            for call in response.json().get("calls") or []:
                if call.get("orderId") == order_id:
                    status = call.get("status")
                    if status in {"completed", "escalated", "cancelled"}:
                        return call
        time.sleep(2.0)
    raise TimeoutError(f"call for order {order_id} did not reach terminal status within {timeout_seconds}s")


@pytest.mark.integration
def test_platform_health() -> None:
    if not _api_reachable():
        pytest.skip(f"platform API not reachable at {_api_base()} — start avip-platform (task up)")
    response = httpx.get(f"{_api_base()}/health", timeout=5.0)
    body = response.json()
    assert response.status_code == 200
    assert body.get("ok") is True


@pytest.mark.integration
def test_simulate_rto_starts_workflow() -> None:
    if os.getenv("AVIP_SMOKE_FULL", "").lower() not in {"1", "true", "yes"}:
        pytest.skip("set AVIP_SMOKE_FULL=1 to run simulate-rto smoke")
    if not _api_reachable():
        pytest.skip(f"platform API not reachable at {_api_base()} — start avip-platform (task up)")

    shop = os.getenv(
        "SMOKE_SHOP",
        os.getenv("AVIP_DEV_STORE", "avip-store-ioj9xku3.myshopify.com"),
    )
    order_id = os.getenv("SMOKE_ORDER_ID", f"pytest-{os.getpid()}")
    response = httpx.post(
        f"{_api_base()}/dev/simulate-rto",
        params={"orderId": order_id, "shop": shop},
        json={},
        timeout=30.0,
    )
    body = response.json()
    assert response.status_code == 200, body
    assert body.get("ok") is True
    assert body.get("simulation") is True
    assert body.get("workflowId")


@pytest.mark.integration
def test_simulate_rto_completes_workflow() -> None:
    if os.getenv("AVIP_SMOKE_FULL", "").lower() not in {"1", "true", "yes"}:
        pytest.skip("set AVIP_SMOKE_FULL=1 to run simulate-rto smoke")
    if not _api_reachable():
        pytest.skip(f"platform API not reachable at {_api_base()} — start avip-platform (task up)")

    shop = os.getenv(
        "SMOKE_SHOP",
        os.getenv("AVIP_DEV_STORE", "avip-store-ioj9xku3.myshopify.com"),
    )
    order_id = os.getenv("SMOKE_ORDER_ID", f"pytest-e2e-{os.getpid()}-{int(time.time())}")
    response = httpx.post(
        f"{_api_base()}/dev/simulate-rto",
        params={"orderId": order_id, "shop": shop},
        json={},
        timeout=30.0,
    )
    body = response.json()
    assert response.status_code == 200, body
    workflow_id = body.get("workflowId")
    assert workflow_id

    call = _poll_call_status(shop=shop, order_id=order_id)
    assert call.get("status") == "completed", call
    assert call.get("workflowId") == workflow_id
    assert call.get("outcome")
