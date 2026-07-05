from __future__ import annotations

import logging

from livekit.agents import AgentSession

from avip_agent.dialogue.turn_planner import infer_failure_reason
from avip_agent.job_state import JobState
from avip_agent.metadata import JobMetadata
from avip_agent.openrouter import OpenRouterClient

logger = logging.getLogger(__name__)


async def say(session: AgentSession, text: str) -> None:
    try:
        logger.info("[agent] saying: %r", text)
        handle = session.say(text, add_to_chat_ctx=False)
        await handle.wait_for_playout()
    except Exception as exc:
        logger.warning("[agent] failed to say %r: %s", text, exc)


async def finalize_pstn_reason(
    state: JobState,
    llm: OpenRouterClient,
    meta: JobMetadata,
) -> str:
    utterances = state.list()
    reason = infer_failure_reason(utterances)
    if reason:
        return reason
    if utterances:
        instructions = meta.system_prompt or "You are an RTO recovery agent."
        try:
            summary = await llm.chat(
                instructions,
                "Summarize in one short sentence why delivery failed based on: "
                + " | ".join(utterances),
            )
            if summary.strip():
                return summary.strip()
        except Exception as exc:
            logger.warning("[agent] finalize reason: %s", exc)
    return "Customer reason not clearly captured"
