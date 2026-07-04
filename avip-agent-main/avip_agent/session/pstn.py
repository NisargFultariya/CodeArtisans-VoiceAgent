from __future__ import annotations

import asyncio
import logging
import time

from livekit import rtc
from livekit.agents import AgentSession

from avip_agent.dialogue.language import normalize_demo_lang
from avip_agent.dialogue.turn_planner import plan_demo_turn
from avip_agent.dialogue.recruitment_planner import plan_recruitment_turn, extract_recruitment_details
from avip_agent.job_state import JobState
from avip_agent.metadata import JobMetadata
from avip_agent.openrouter import OpenRouterClient
from avip_agent.session.participants import remote_participants
from avip_agent.session.speech import finalize_pstn_reason, say

logger = logging.getLogger(__name__)


async def run_pstn_session(
    *,
    room: rtc.Room,
    session: AgentSession,
    llm: OpenRouterClient,
    state: JobState,
    meta: JobMetadata,
    initial_greeting: str = "",
) -> tuple[str, list[str]]:
    lang = normalize_demo_lang(meta.language)
    last = 0
    turns = 0
    alone_ticks = 0
    deadline = time.monotonic() + 300

    is_recruitment = (meta.scenario or "").strip().lower() in ("recruitment", "hr", "screening")

    # Keep a running chat history for recruitment scenario to maintain context
    chat_history: list[dict[str, str]] = []
    if is_recruitment and initial_greeting:
        chat_history.append({"role": "assistant", "content": initial_greeting})

    await asyncio.sleep(0.8)

    while time.monotonic() < deadline and turns < 15:
        await asyncio.sleep(0.4)
        if not remote_participants(room):
            alone_ticks += 1
            if alone_ticks >= 8:
                logger.info("[agent] %s: caller hung up", room.name)
                if is_recruitment:
                    final_reason = await extract_recruitment_details(
                        llm, chat_history, meta, final_outcome="CALL_DISCONNECTED"
                    )
                    return final_reason, state.list()
                return await finalize_pstn_reason(state, llm, meta), state.list()
            continue
        alone_ticks = 0

        utterances = state.list()
        if len(utterances) <= last:
            continue

        # Add new candidate utterances
        for i in range(last, len(utterances)):
            new_text = utterances[i].strip()
            if new_text and is_recruitment:
                chat_history.append({"role": "user", "content": new_text})

        last = len(utterances)
        turns += 1
        logger.info(
            "[agent] %s: caller=%r (turn %d)",
            room.name,
            utterances[-1],
            turns,
        )

        if is_recruitment:
            reply, ready_to_close, outcome, callback_time = await plan_recruitment_turn(
                llm, chat_history, meta
            )
            if reply.strip():
                await say(session, reply)
                chat_history.append({"role": "assistant", "content": reply})

            if ready_to_close:
                final_reason = await extract_recruitment_details(
                    llm, chat_history, meta, final_outcome=outcome, final_callback_time=callback_time
                )
                await asyncio.sleep(2)
                return final_reason, state.list()
        else:
            plan = await plan_demo_turn(llm, utterances, lang)
            if plan.reply.strip():
                await say(session, plan.reply)

            if plan.ready_to_close:
                reason = plan.failure_reason
                if plan.reschedule:
                    reason = f"{reason}; reschedule: {plan.reschedule}"
                await asyncio.sleep(2)
                return reason, utterances

    logger.info("[agent] %s: pstn session timeout (turns=%d)", room.name, turns)
    if is_recruitment:
        final_reason = await extract_recruitment_details(
            llm, chat_history, meta, final_outcome="FAILED", final_callback_time=None
        )
        return final_reason, state.list()
    return await finalize_pstn_reason(state, llm, meta), state.list()
