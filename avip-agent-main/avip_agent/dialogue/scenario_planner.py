from __future__ import annotations

import logging
from dataclasses import dataclass

from avip_agent.dialogue.language import normalize_demo_lang
from avip_agent.dialogue.scenario_goals import reply_script_hint, scenario_goal
from avip_agent.dialogue.scenario_signals import (
    clarify_reply_for_scenario,
    infer_answer_for_scenario,
    is_clarifying_question,
)
from avip_agent.dialogue.scenarios import (
    demo_scenario_closing,
    demo_scenario_question,
    normalize_scenario,
)
from avip_agent.dialogue.turn_planner import is_permission_to_talk, is_short_ack
from avip_agent.openrouter import OpenRouterClient

logger = logging.getLogger(__name__)


@dataclass
class ScenarioTurnPlan:
    ready_to_close: bool = False
    answer: str = ""
    reply: str = ""


def plan_scenario_turn(
    utterances: list[str],
    active_lang: str,
    scenario: str,
) -> ScenarioTurnPlan:
    """Browser demo: greeting ack → scenario question → capture answer → close."""
    scenario = normalize_scenario(scenario)
    active_lang = normalize_demo_lang(active_lang)

    last = utterances[-1].strip() if utterances else ""
    if last and is_clarifying_question(last):
        clarify = clarify_reply_for_scenario(scenario, active_lang)
        if clarify:
            return ScenarioTurnPlan(ready_to_close=False, reply=clarify)

    answer = infer_scenario_answer(utterances, scenario)
    if answer:
        return ScenarioTurnPlan(
            ready_to_close=True,
            answer=answer,
            reply=demo_scenario_closing(scenario, active_lang, answer),
        )

    return ScenarioTurnPlan(
        ready_to_close=False,
        reply=demo_scenario_question(scenario, active_lang),
    )


def infer_scenario_answer(utterances: list[str], scenario: str = "availability") -> str:
    """Collect substantive customer lines and infer whether the scenario goal is met."""
    substantive: list[str] = []
    for utterance in utterances:
        text = utterance.strip()
        if not text or is_permission_to_talk(text):
            continue
        if is_short_ack(text):
            continue
        substantive.append(text)

    return infer_answer_for_scenario(scenario, substantive)


async def plan_scenario_turn_async(
    llm: OpenRouterClient | None,
    utterances: list[str],
    active_lang: str,
    scenario: str,
) -> ScenarioTurnPlan:
    """Rules decide close/clarify/re-ask; LLM only polishes spoken reply text."""
    rule = plan_scenario_turn(utterances, active_lang, scenario)
    if llm is None:
        return rule

    if rule.ready_to_close:
        try:
            reply = await _llm_closing_reply(
                llm,
                utterances,
                active_lang,
                scenario,
                rule.answer,
            )
        except Exception as exc:
            logger.warning("scenario llm closing: %s", exc)
            reply = rule.reply
        return ScenarioTurnPlan(
            ready_to_close=True,
            answer=rule.answer,
            reply=reply or rule.reply,
        )

    last = utterances[-1].strip() if utterances else ""
    if last and is_clarifying_question(last):
        try:
            reply = await _llm_clarify_reply(llm, utterances, active_lang, scenario)
        except Exception as exc:
            logger.warning("scenario llm clarify: %s", exc)
            reply = rule.reply
        return ScenarioTurnPlan(ready_to_close=False, reply=reply or rule.reply)

    # No answer yet — stick to the predetermined scenario question (no LLM re-ask loop).
    return ScenarioTurnPlan(
        ready_to_close=False,
        reply=demo_scenario_question(scenario, active_lang),
    )


async def _llm_closing_reply(
    llm: OpenRouterClient,
    utterances: list[str],
    active_lang: str,
    scenario: str,
    answer: str,
) -> str:
    scenario = normalize_scenario(scenario)
    active_lang = normalize_demo_lang(active_lang)
    transcript = "\n".join(f"- {line}" for line in utterances)
    system = (
        "You write the closing spoken line for Soniqa's delivery recovery demo. "
        "Return plain text only — 1-2 short sentences for TTS. "
        "Thank the customer, confirm the captured detail naturally, "
        "and do not ask another question."
    )
    user = (
        f"Language: {active_lang}\n"
        f"Script: {reply_script_hint(active_lang)}\n"
        f"Scenario: {scenario}\n"
        f"Goal: {scenario_goal(scenario)}\n"
        f"Captured answer: {answer}\n\n"
        f"Customer transcript:\n{transcript}"
    )
    raw = await llm.chat(system, user)
    return raw.strip()


async def _llm_clarify_reply(
    llm: OpenRouterClient,
    utterances: list[str],
    active_lang: str,
    scenario: str,
) -> str:
    scenario = normalize_scenario(scenario)
    active_lang = normalize_demo_lang(active_lang)
    fallback = clarify_reply_for_scenario(scenario, active_lang)
    transcript = "\n".join(f"- {line}" for line in utterances)
    system = (
        "You write one clarifying spoken line for Soniqa's delivery demo. "
        "Return plain text only — 1-2 short sentences for TTS. "
        "Answer the customer's question briefly, then re-ask the scenario goal once."
    )
    user = (
        f"Language: {active_lang}\n"
        f"Script: {reply_script_hint(active_lang)}\n"
        f"Scenario: {scenario}\n"
        f"Goal: {scenario_goal(scenario)}\n\n"
        f"Customer transcript:\n{transcript}\n\n"
        f"If helpful, you may follow this fallback: {fallback}"
    )
    raw = await llm.chat(system, user)
    text = raw.strip()
    return text or fallback
