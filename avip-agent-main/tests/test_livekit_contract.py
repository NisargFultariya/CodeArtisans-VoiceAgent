from __future__ import annotations

import json
import os

import pytest

# LiveKit Agents ships a pytest plugin and session testing utilities.
# AVIP uses scripted dialogue with optional LLM field extraction; keep LiveKit
# integration optional behind a marker.


@pytest.mark.integration
@pytest.mark.skipif(
    not os.getenv("LIVEKIT_URL") or not os.getenv("LIVEKIT_API_KEY"),
    reason="Set LIVEKIT_URL and LIVEKIT_API_KEY to run LiveKit integration checks",
)
def test_livekit_credentials_present() -> None:
    """Sanity check that LiveKit env vars are loadable before manual/console runs."""
    assert os.environ["LIVEKIT_URL"].startswith("wss")
    assert os.environ["LIVEKIT_API_KEY"]


@pytest.mark.unit
def test_dispatch_metadata_contract_matches_platform() -> None:
    """JSON keys must stay aligned with avip-platform MIGRATION_PLAN.md."""
    sample = {
        "workflowId": "wf",
        "shopId": "shop",
        "orderId": "order",
        "stage": "ndr1",
        "language": "hi-IN",
        "systemPrompt": "prompt",
        "simulationMode": False,
        "customerName": "Name",
        "orderName": "Order",
    }
    raw = json.dumps(sample)
    from avip_agent.metadata import parse_job_metadata

    meta = parse_job_metadata(raw)
    assert meta.workflow_id == "wf"
    assert meta.language == "hi-IN"
    # `stage` is reserved for platform; agent ignores it today but must not break parsing.
    assert json.loads(raw)["stage"] == "ndr1"
