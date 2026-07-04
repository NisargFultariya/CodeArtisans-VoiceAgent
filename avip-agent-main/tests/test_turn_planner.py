from __future__ import annotations

import pytest

from avip_agent.dialogue.turn_planner import (
    fallback_demo_plan,
    infer_failure_reason,
    infer_reschedule,
    is_short_ack,
    plan_demo_turn,
)
from tests.conftest import FakeLLM


@pytest.mark.unit
def test_infer_failure_reason_skips_short_acks() -> None:
    utterances = ["हाँ", "गेट पर कोई नहीं था इसलिए डिलीवरी नहीं हो पाई"]
    assert infer_failure_reason(utterances) == "गेट पर कोई नहीं था इसलिए डिलीवरी नहीं हो पाई"


@pytest.mark.unit
def test_infer_reschedule_from_latest_hint() -> None:
    utterances = [
        "address galat tha",
        "kal shaam 6 baje dubara bhej do",
    ]
    assert "kal shaam" in infer_reschedule(utterances)


@pytest.mark.unit
def test_plan_asks_reason_when_missing() -> None:
    plan = fallback_demo_plan(["हाँ, बोलिए"], "hi-IN")
    assert plan.has_failure_reason is False
    assert plan.ready_to_close is False
    assert "डिलीवरी" in plan.reply


@pytest.mark.unit
def test_plan_asks_reschedule_after_reason() -> None:
    plan = fallback_demo_plan(
        ["customer was not home, nobody at gate"],
        "hi-IN",
    )
    assert plan.has_failure_reason is True
    assert plan.has_reschedule is False
    assert plan.ready_to_close is False
    assert "दोबारा" in plan.reply


@pytest.mark.unit
def test_plan_closes_when_reason_and_reschedule_present() -> None:
    utterances = [
        "customer was not available at delivery address",
        "please redeliver tomorrow evening",
    ]
    plan = fallback_demo_plan(utterances, "hi-IN")
    assert plan.ready_to_close is True
    assert plan.failure_reason
    assert plan.reschedule
    assert "धन्यवाद" in plan.reply


@pytest.mark.unit
@pytest.mark.asyncio
async def test_plan_demo_turn_merges_llm_hints() -> None:
    llm = FakeLLM(
        '{"has_failure_reason":true,"failure_reason":"wrong pincode",'
        '"has_reschedule":true,"reschedule":"Monday morning"}'
    )
    plan = await plan_demo_turn(llm, ["ok"], "hi-IN")
    assert plan.ready_to_close is True
    assert plan.failure_reason == "wrong pincode"
    assert plan.reschedule == "Monday morning"
    assert len(llm.calls) == 1


@pytest.mark.unit
def test_infer_failure_reason_skips_reschedule_line() -> None:
    utterances = [
        "हाँ बोलिए।",
        "मैं घर के बाहर था इसलिए।",
        "कल शाम को कर देते हैं आठ बजे।",
    ]
    assert infer_failure_reason(utterances) == "मैं घर के बाहर था इसलिए।"
    assert infer_reschedule(utterances) == "कल शाम को कर देते हैं आठ बजे।"


@pytest.mark.unit
def test_plan_closes_with_distinct_reason_and_reschedule_hi() -> None:
    utterances = [
        "हाँ बोलिए।",
        "मैं घर के बाहर था इसलिए।",
        "कल शाम को कर देते हैं आठ बजे।",
    ]
    plan = fallback_demo_plan(utterances, "hi-IN")
    assert plan.ready_to_close is True
    assert plan.failure_reason == "मैं घर के बाहर था इसलिए।"
    assert plan.reschedule == "कल शाम को कर देते हैं आठ बजे।"
    assert plan.failure_reason not in plan.reply or plan.reschedule in plan.reply
    assert "घर के बाहर" in plan.reply
    assert "को दोबारा करेंगे" not in plan.reply
    assert "पर दोबारा करेंगे" in plan.reply


@pytest.mark.unit
def test_is_short_ack() -> None:
    assert is_short_ack("ok")
    assert is_short_ack("हाँ")
    assert not is_short_ack("customer refused the parcel")
