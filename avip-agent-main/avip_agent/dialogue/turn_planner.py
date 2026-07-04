from __future__ import annotations

import json
import logging
import re
import unicodedata
from dataclasses import dataclass

from avip_agent.dialogue.language import contains_reschedule_hint, normalize_demo_lang
from avip_agent.dialogue.scripts import (
    demo_ask_reason,
    demo_ask_reschedule,
    demo_closing_message,
)
from avip_agent.openrouter import OpenRouterClient

logger = logging.getLogger(__name__)

_SHORT_ACKS = {"ha", "yes", "ok", "okay", "हां", "हाँ", "हो", "हूँ", "હા"}


@dataclass
class DemoTurnPlan:
    has_failure_reason: bool = False
    failure_reason: str = ""
    has_reschedule: bool = False
    reschedule: str = ""
    ready_to_close: bool = False
    reply: str = ""


@dataclass
class DemoExtract:
    has_failure_reason: bool = False
    failure_reason: str = ""
    has_reschedule: bool = False
    reschedule: str = ""


async def plan_demo_turn(
    llm: OpenRouterClient | None,
    utterances: list[str],
    active_lang: str,
) -> DemoTurnPlan:
    active_lang = normalize_demo_lang(active_lang)
    plan = _build_demo_plan(utterances, active_lang)
    if llm is None:
        return plan
    try:
        hints = await llm_extract_fields(llm, utterances, active_lang)
        if hints.has_failure_reason and hints.failure_reason.strip():
            plan.has_failure_reason = True
            if not infer_failure_reason(utterances):
                plan.failure_reason = hints.failure_reason.strip()
        if hints.has_reschedule and hints.reschedule.strip():
            plan.has_reschedule = True
            if not plan.reschedule.strip():
                plan.reschedule = hints.reschedule.strip()
        plan = _normalize_demo_plan(plan, utterances, active_lang)
    except Exception as exc:
        logger.warning("llm extract: %s", exc)
    return plan


async def llm_extract_fields(
    llm: OpenRouterClient,
    utterances: list[str],
    active_lang: str,
) -> DemoExtract:
    transcript = "\n- ".join(utterances)
    prompt = (
        f"Language context: {active_lang}\n"
        "Extract delivery-failure reason and reschedule time from the transcript.\n"
        'Return JSON only: {"has_failure_reason":bool,"failure_reason":string,'
        '"has_reschedule":bool,"reschedule":string}\n'
        "Use the customer's words where possible. Do not add fields.\n\n"
        f"Transcript:\n- {transcript}"
    )
    raw = await llm.chat(
        "You extract structured fields only. No customer-facing prose.",
        prompt,
    )
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?", "", raw).strip()
    raw = re.sub(r"```$", "", raw).strip()
    data = json.loads(raw)
    return DemoExtract(
        has_failure_reason=bool(data.get("has_failure_reason")),
        failure_reason=str(data.get("failure_reason") or ""),
        has_reschedule=bool(data.get("has_reschedule")),
        reschedule=str(data.get("reschedule") or ""),
    )


def fallback_demo_plan(utterances: list[str], active_lang: str) -> DemoTurnPlan:
    return _build_demo_plan(utterances, active_lang)


def _build_demo_plan(utterances: list[str], active_lang: str) -> DemoTurnPlan:
    reason = infer_failure_reason(utterances)
    reschedule = infer_reschedule(utterances)
    return _normalize_demo_plan(
        DemoTurnPlan(
            has_failure_reason=bool(reason),
            failure_reason=reason,
            has_reschedule=bool(reschedule),
            reschedule=reschedule,
        ),
        utterances,
        active_lang,
    )


def _normalize_demo_plan(
    plan: DemoTurnPlan,
    utterances: list[str],
    active_lang: str,
) -> DemoTurnPlan:
    active_lang = normalize_demo_lang(active_lang)
    if reason := infer_failure_reason(utterances):
        plan.has_failure_reason = True
        plan.failure_reason = reason
    if reschedule := infer_reschedule(utterances):
        plan.has_reschedule = True
        plan.reschedule = reschedule
    if plan.has_failure_reason and plan.has_reschedule:
        plan.ready_to_close = True
        plan.reply = demo_closing_message(active_lang, plan.failure_reason, plan.reschedule)
    elif plan.has_failure_reason:
        plan.ready_to_close = False
        plan.reply = demo_ask_reschedule(active_lang)
    else:
        plan.ready_to_close = False
        plan.reply = demo_ask_reason(active_lang)
    return plan


def infer_failure_reason(utterances: list[str]) -> str:
    reschedule = infer_reschedule(utterances)
    best = ""
    best_score = 0
    for utterance in utterances:
        text = utterance.strip()
        if not text or is_short_ack(text) or is_permission_to_talk(text):
            continue
        if contains_reschedule_hint(text):
            continue
        if reschedule and text == reschedule:
            continue
        score = len(text)
        if score > best_score:
            best_score = score
            best = text
    return best


def infer_reschedule(utterances: list[str]) -> str:
    for utterance in reversed(utterances):
        text = utterance.strip()
        if not text or is_short_ack(text):
            continue
        if contains_reschedule_hint(text):
            return text
    return ""


def is_short_ack(text: str) -> bool:
    cleaned = text.strip().strip(".,!?।")
    if not cleaned:
        return True
    if len(cleaned) <= 4:
        return True
    lower = cleaned.lower()
    for ack in _SHORT_ACKS:
        if lower == ack or lower.startswith(f"{ack} "):
            return True
    letters = sum(1 for ch in cleaned if unicodedata.category(ch).startswith("L"))
    return letters <= 4


def is_permission_to_talk(text: str) -> bool:
    lower = text.lower()
    return any(
        hint in lower
        for hint in ("बोलिए", "बोलो", "બોલો", "बात कर", "speak", "बोल")
    )
