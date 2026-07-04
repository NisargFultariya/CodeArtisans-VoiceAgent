from __future__ import annotations

import json

import pytest

from avip_agent.metadata import JobMetadata, is_demo_room, parse_job_metadata


@pytest.mark.unit
def test_parse_empty_metadata_defaults() -> None:
    meta = parse_job_metadata("")
    assert meta.workflow_id == ""
    assert meta.language == "hi-IN"
    assert meta.is_demo is True


@pytest.mark.unit
def test_parse_production_metadata() -> None:
    raw = json.dumps(
        {
            "workflowId": "wf-123",
            "shopId": "shop-1",
            "orderId": "order-9",
            "systemPrompt": "Be polite.",
            "simulationMode": False,
            "customerName": "Ravi",
            "orderName": "#1001",
            "language": "gu-IN",
            "objective": "get_reason",
        }
    )
    meta = parse_job_metadata(raw)
    assert meta.workflow_id == "wf-123"
    assert meta.shop_id == "shop-1"
    assert meta.order_id == "order-9"
    assert meta.system_prompt == "Be polite."
    assert meta.customer_name == "Ravi"
    assert meta.order_name == "#1001"
    assert meta.language == "gu-IN"
    assert meta.objective == "get_reason"
    assert meta.is_demo is False


@pytest.mark.unit
def test_parse_simulation_mode_without_workflow_is_demo() -> None:
    raw = json.dumps({"simulationMode": True, "shopId": "s", "orderId": "o"})
    meta = parse_job_metadata(raw)
    assert meta.simulation_mode is True
    assert meta.is_demo is True
    assert meta.is_simulation is False


@pytest.mark.unit
def test_parse_invalid_json_returns_defaults() -> None:
    meta = parse_job_metadata("{not-json")
    assert isinstance(meta, JobMetadata)
    assert meta.language == "hi-IN"


@pytest.mark.unit
def test_is_demo_room_prefix() -> None:
    assert is_demo_room("avip-demo-abc")
    assert not is_demo_room("avip-call-abc")
