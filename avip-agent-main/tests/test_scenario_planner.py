from __future__ import annotations

import pytest

from avip_agent.dialogue.scenario_planner import (
    infer_scenario_answer,
    plan_scenario_turn,
    plan_scenario_turn_async,
)
from avip_agent.dialogue.scenarios import demo_scenario_question, normalize_scenario
from tests.conftest import FakeLLM


@pytest.mark.unit
def test_normalize_scenario_defaults() -> None:
    assert normalize_scenario("") == "availability"
    assert normalize_scenario("landmark") == "landmark"
    assert normalize_scenario("backup-contact") == "backup_contact"


@pytest.mark.unit
def test_landmark_question_hi() -> None:
    question = demo_scenario_question("landmark", "hi-IN")
    assert "landmark" in question.lower()


@pytest.mark.unit
def test_infer_scenario_answer_after_ack() -> None:
    utterances = ["haan boliye", "Mera ghar City Mall ke paas hai"]
    assert infer_scenario_answer(utterances) == "Mera ghar City Mall ke paas hai"


@pytest.mark.unit
def test_plan_scenario_reasks_when_no_answer() -> None:
    plan = plan_scenario_turn(["haan boliye"], "hi-IN", "payment")
    assert plan.ready_to_close is False
    assert "cash" in plan.reply.lower() or "UPI" in plan.reply


@pytest.mark.unit
def test_plan_scenario_closes_with_answer() -> None:
    utterances = ["haan", "Main kal subah 11 baje ghar par rahunga"]
    plan = plan_scenario_turn(utterances, "hi-IN", "availability")
    assert plan.ready_to_close is True
    assert "11 baje" in plan.answer
    assert "शेड्यूल" in plan.reply
    assert "11 baje" not in plan.reply


@pytest.mark.unit
def test_availability_closing_hi_does_not_embed_answer() -> None:
    utterances = ["haan boliye", "हाँ, मैं अवेलेबल रहूँगा।"]
    plan = plan_scenario_turn(utterances, "hi-IN", "availability")
    assert plan.ready_to_close is True
    assert plan.answer == "हाँ, मैं अवेलेबल रहूँगा।"
    assert "Hum delivery" not in plan.reply
    assert "अवेलेबल" not in plan.reply


@pytest.mark.unit
def test_infer_scenario_answer_milunga() -> None:
    utterances = ["haan boliye", "हाँ, मैं मिलूँगा।"]
    assert infer_scenario_answer(utterances, "availability") == "हाँ, मैं मिलूँगा।"


@pytest.mark.unit
def test_infer_scenario_answer_multiturn_address_and_yes() -> None:
    utterances = [
        "haan boliye",
        "हाँ, मैं मिलूँगा।",
        "कौन से पते पर?",
        "मेरे घर पर चाँद लोढ़िया।",
        "हाँ, मैं होऊँगा।",
        "हां",
    ]
    answer = infer_scenario_answer(utterances, "availability")
    assert "चाँद लोढ़िया" in answer


@pytest.mark.unit
def test_plan_clarifies_on_address_question() -> None:
    utterances = ["haan boliye", "हाँ, मैं मिलूँगा।", "कौन से पते पर?"]
    plan = plan_scenario_turn(utterances, "hi-IN", "availability")
    assert plan.ready_to_close is False
    assert "ऑर्डर" in plan.reply or "address" in plan.reply.lower()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_plan_scenario_turn_async_uses_llm_reply() -> None:
    llm = FakeLLM("धन्यवाद! कल सुबह दस से पाँच बजे के बीच डिलीवरी शेड्यूल कर देंगे।")
    utterances = ["haan boliye", "हाँ, मैं अवेलेबल रहूँगा।"]
    plan = await plan_scenario_turn_async(llm, utterances, "hi-IN", "availability")
    assert plan.ready_to_close is True
    assert "शेड्यूल" in plan.reply
    assert len(llm.calls) == 1


@pytest.mark.unit
@pytest.mark.asyncio
async def test_plan_scenario_turn_async_rules_close_even_if_llm_would_reask() -> None:
    llm = FakeLLM("क्या आप फिर से बता सकते हैं?")
    utterances = ["haan boliye", "हाँ, मैं मिलूँगा।"]
    plan = await plan_scenario_turn_async(llm, utterances, "hi-IN", "availability")
    assert plan.ready_to_close is True
    assert "फिर से" not in plan.reply


@pytest.mark.unit
@pytest.mark.asyncio
async def test_plan_scenario_turn_async_no_llm_reask_when_unanswered() -> None:
    llm = FakeLLM("ignored")
    plan = await plan_scenario_turn_async(llm, ["haan boliye"], "hi-IN", "availability")
    assert plan.ready_to_close is False
    assert plan.reply == demo_scenario_question("availability", "hi-IN")
    assert len(llm.calls) == 0


@pytest.mark.unit
@pytest.mark.asyncio
async def test_plan_scenario_turn_async_falls_back_on_llm_error() -> None:
    class BrokenLLM(FakeLLM):
        async def chat(self, system_prompt: str, user_prompt: str, *, model: str | None = None) -> str:
            raise RuntimeError("boom")

    utterances = ["haan boliye", "हाँ, मैं अवेलेबल रहूँगा।"]
    plan = await plan_scenario_turn_async(BrokenLLM(""), utterances, "hi-IN", "availability")
    assert plan.ready_to_close is True
    assert plan.answer == "हाँ, मैं अवेलेबल रहूँगा।"
