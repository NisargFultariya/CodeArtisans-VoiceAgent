from __future__ import annotations

import json

import pytest

from avip_agent.dialogue.simulation_script import customer_lines_for
from avip_agent.dialogue.turn_planner import plan_demo_turn
from avip_agent.metadata import parse_job_metadata


@pytest.mark.unit
def test_simulation_metadata_with_workflow() -> None:
    raw = json.dumps(
        {
            "workflowId": "call-shop-order-1",
            "shopId": "shop-1",
            "orderId": "order-9",
            "simulationMode": True,
            "language": "hi-IN",
        }
    )
    meta = parse_job_metadata(raw)
    assert meta.is_demo is False
    assert meta.is_simulation is True


@pytest.mark.unit
def test_simulation_script_completes_dialogue() -> None:
    lines = customer_lines_for("hi-IN")
    assert len(lines) >= 3


@pytest.mark.asyncio
@pytest.mark.unit
async def test_simulation_script_turns_close_without_llm() -> None:
    utterances: list[str] = []
    greeted = False
    for line in customer_lines_for("hi-IN"):
        utterances.append(line)
        if not greeted:
            greeted = True
            continue
        plan = await plan_demo_turn(None, utterances, "hi-IN")
        if plan.ready_to_close:
            assert plan.failure_reason
            assert plan.reschedule
            return
    pytest.fail("expected ready_to_close before script exhausted")
