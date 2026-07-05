from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

from livekit import rtc
from livekit.agents import Agent, AgentSession, JobContext

from avip_agent.config import Config
from avip_agent.dialogue.language import normalize_demo_lang
from avip_agent.dialogue.scenario_planner import plan_scenario_turn_async
from avip_agent.dialogue.scenarios import demo_scenario_question
from avip_agent.dialogue.scripts import demo_greeting_good_time
from avip_agent.dialogue.simulation_script import customer_lines_for
from avip_agent.dialogue.turn_planner import plan_demo_turn
from avip_agent.job_state import JobState
from avip_agent.metadata import JobMetadata
from avip_agent.openrouter import OpenRouterClient
from avip_agent.sarvam import SarvamClient, SarvamSTT, SarvamTTS
from avip_agent.session.participants import remote_participants
from avip_agent.session.pstn import run_pstn_session
from avip_agent.session.speech import say
from avip_agent.signal import call_completed
from avip_agent.trai import with_trai_disclosure
from avip_agent.dialogue.recruitment_planner import plan_recruitment_turn

logger = logging.getLogger(__name__)

DEMO_USER_WAIT_SECONDS = 45
DEMO_SESSION_MAX_SECONDS = 180
DEMO_POLL_INTERVAL_SECONDS = 0.5
DEMO_ALONE_TICKS_BEFORE_EXIT = 6
DEMO_CLOSE_DELAY_SECONDS = 5
DEMO_MAX_TURNS = 10


async def wait_for_remote_participant(room: rtc.Room, timeout_seconds: float) -> bool:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if remote_participants(room):
            return True
        await asyncio.sleep(0.25)
    return False


async def run_demo_flow(
    room: rtc.Room,
    meta: JobMetadata,
    llm: OpenRouterClient,
    state: JobState,
) -> None:
    room_name = room.name
    demo_lang = normalize_demo_lang(meta.language)
    state.set_demo_lang(demo_lang)
    state.set_demo_scenario(meta.scenario)
    if await wait_for_remote_participant(room, DEMO_USER_WAIT_SECONDS):
        logger.info("[demo] %s: demo user joined — greeting (%s)", room_name, demo_lang)
        is_recruitment = (meta.scenario or "").strip().lower() in ("recruitment", "hr", "screening")
        if is_recruitment:
            candidate_name = meta.customer_name or "Saurabh"
            if demo_lang.startswith("hi"):
                greeting = f"नमस्ते, क्या मैं {candidate_name} से बात कर सकती हूँ?"
            else:
                greeting = f"Hi, may I speak with {candidate_name}?"
        else:
            greeting = demo_greeting_good_time(demo_lang)

        await say_demo(
            room,
            with_trai_disclosure(greeting, demo_lang),
            demo_lang,
        )
    else:
        logger.info("[demo] %s: no demo user within %ss — skip greeting", room_name, DEMO_USER_WAIT_SECONDS)
    await run_demo_session(room=room, llm=llm, state=state, meta=meta)


async def run_simulation_flow(
    ctx: JobContext,
    cfg: Config,
    meta: JobMetadata,
    llm: OpenRouterClient,
    state: JobState,
) -> None:
    """Scripted RTO dialogue for simulate-rto; signals Temporal when done."""
    room_name = ctx.room.name
    lang = normalize_demo_lang(meta.language)
    lines = customer_lines_for(lang)
    start = time.monotonic()
    greeted = False

    logger.info(
        "[sim] %s: scripted simulation workflow=%s order=%s",
        room_name,
        meta.workflow_id,
        meta.order_id,
    )

    for line in lines:
        state.add(line)
        if not greeted:
            greeted = True
            continue

        plan = await plan_demo_turn(llm, state.list(), lang)
        logger.info("[sim] %s: planned reply ready_to_close=%s", room_name, plan.ready_to_close)
        if plan.ready_to_close:
            reason = plan.failure_reason
            if plan.reschedule:
                reason = f"{reason}; reschedule: {plan.reschedule}"
            duration = max(1, int(time.monotonic() - start))
            await call_completed(
                api_url=cfg.avip_api_url,
                secret=cfg.avip_internal_signal_secret,
                workflow_id=meta.workflow_id,
                outcome="completed",
                reason=reason,
                language=lang,
                call_duration_seconds=duration,
                user_utterances=state.list(),
                agent_id=ctx.job.id,
            )
            logger.info("[sim] signaled workflow %s reason=%r", meta.workflow_id, reason)
            return

    duration = max(1, int(time.monotonic() - start))
    plan = await plan_demo_turn(llm, state.list(), lang)
    reason = plan.failure_reason or "Simulation completed without clear reason"
    await call_completed(
        api_url=cfg.avip_api_url,
        secret=cfg.avip_internal_signal_secret,
        workflow_id=meta.workflow_id,
        outcome="completed",
        reason=reason,
        language=lang,
        call_duration_seconds=duration,
        user_utterances=state.list(),
        agent_id=ctx.job.id,
    )
    logger.info("[sim] %s: fallback signal workflow=%s", room_name, meta.workflow_id)


async def run_pstn_flow(
    ctx: JobContext,
    cfg: Config,
    session: AgentSession,
    state: JobState,
    meta: JobMetadata,
    llm: OpenRouterClient,
) -> None:
    room = ctx.room
    room_name = room.name
    start = time.monotonic()

    greeting = ""
    if await wait_for_remote_participant(room, 60):
        greeting = await speak_pstn_greeting(session=session, llm=llm, meta=meta)
    else:
        logger.info("[agent] %s: no remote participant within 60s — skip greeting", room_name)

    reason, utterances = await run_pstn_session(
        room=room,
        session=session,
        llm=llm,
        state=state,
        meta=meta,
        initial_greeting=greeting,
    )
    duration = int(time.monotonic() - start)
    
    # Check if the active scenario is recruitment to extract the correct outcome
    outcome = "completed"
    is_recruitment = (meta.scenario or "").strip().lower() in ("recruitment", "hr", "screening")
    if is_recruitment:
        try:
            reason_data = json.loads(reason)
            outcome = reason_data.get("call_outcome") or "SCREENING_COMPLETED"
        except Exception:
            outcome = "SCREENING_COMPLETED"

    if meta.workflow_id:
        await call_completed(
            api_url=cfg.avip_api_url,
            secret=cfg.avip_internal_signal_secret,
            workflow_id=meta.workflow_id,
            outcome=outcome,
            reason=reason,
            language=meta.language,
            call_duration_seconds=duration,
            user_utterances=utterances,
            agent_id=ctx.job.id,
        )
        logger.info("[agent] signaled workflow %s with outcome=%s", meta.workflow_id, outcome)
    else:
        logger.info("[agent] no workflowId in metadata — skip Temporal signal")
    logger.info("[agent] session done (%ds) reason=%r", duration, reason)

    # Disconnect from room to hang up PSTN/SIP call
    try:
        logger.info("[agent] disconnecting from room %s to terminate the call", room_name)
        await room.disconnect()
    except Exception as exc:
        logger.warning("[agent] failed to disconnect from room: %s", exc)


async def speak_pstn_greeting(
    *,
    session: AgentSession,
    llm: OpenRouterClient,
    meta: JobMetadata,
) -> str:
    is_recruitment = (meta.scenario or "").strip().lower() in ("recruitment", "hr", "screening")
    if is_recruitment:
        candidate_name = meta.customer_name or "Saurabh"
        if meta.system_prompt and meta.system_prompt.strip():
            greeting_prompt = (
                f"Generate the initial greeting to open the call with candidate '{candidate_name}' "
                f"according to the OPENING instructions in your system prompt. Do not write any JSON, "
                f"respond only with the conversational line to say."
            )
            try:
                clean_system = get_recruitment_system_prompt(meta)
                greeting = await llm.chat(clean_system, greeting_prompt)
                greeting = greeting.strip().strip('"\'')
            except Exception as exc:
                logger.warning("[agent] recruitment LLM greeting failed: %s", exc)
                greeting = f"Hi, may I speak with {candidate_name}?"
        else:
            if meta.language.startswith("hi"):
                greeting = f"नमस्ते, क्या मैं {candidate_name} से बात कर सकती हूँ?"
            else:
                greeting = f"Hi, may I speak with {candidate_name}?"
        await say(session, with_trai_disclosure(greeting, meta.language))
        return greeting

    instructions = meta.system_prompt
    if not instructions:
        if meta.customer_name and meta.order_name:
            instructions = (
                f"You are an RTO recovery agent calling {meta.customer_name} "
                f"regarding order {meta.order_name}."
            )
        else:
            instructions = (
                "You are an RTO recovery agent. Ask why delivery failed and confirm briefly."
            )

    greeting_prompt = "Greet the caller and ask why delivery failed. Keep it brief."
    if meta.customer_name and meta.order_name:
        greeting_prompt = (
            f"Greet {meta.customer_name} by name and ask why order {meta.order_name} "
            "delivery failed. Keep it brief."
        )
    try:
        greeting = await llm.chat(instructions, greeting_prompt)
    except Exception as exc:
        logger.warning("[agent] llm greeting: %s", exc)
        greeting = greeting_prompt
    await say(session, with_trai_disclosure(greeting, meta.language))
    return greeting


async def run_demo_session(
    *,
    room: rtc.Room,
    llm: OpenRouterClient,
    state: JobState,
    meta: JobMetadata = None,
) -> None:
    room_name = room.name
    last = 0
    turns = 0
    alone_ticks = 0
    # First user reply is to the greeting; then ask the selected scenario question.
    greeted = False
    deadline = time.monotonic() + DEMO_SESSION_MAX_SECONDS

    # Resolve recruitment scenario
    scenario = state.demo_scenario()
    is_recruitment = (scenario or "").strip().lower() in ("recruitment", "hr", "screening")
    chat_history: list[dict[str, str]] = []

    # Get active language
    active_lang = state.demo_lang()
    
    # Initial greeting spoken logic handled by run_demo_flow
    if is_recruitment:
        candidate_name = (meta.customer_name if meta else "") or "Saurabh"
        if active_lang.startswith("hi"):
            initial_greeting = f"नमस्ते, क्या मैं {candidate_name} से बात कर सकती हूँ?"
        else:
            initial_greeting = f"Hi, may I speak with {candidate_name}?"
        chat_history.append({"role": "assistant", "content": initial_greeting})
        greeted = True # The greeting was already sent in run_demo_flow

    while time.monotonic() < deadline and turns < DEMO_MAX_TURNS:
        await asyncio.sleep(DEMO_POLL_INTERVAL_SECONDS)
        if not remote_participants(room):
            alone_ticks += 1
            if alone_ticks >= DEMO_ALONE_TICKS_BEFORE_EXIT:
                logger.info("[demo] %s: no remote participants — ending session", room_name)
                return
            continue
        alone_ticks = 0

        utterances = state.list()
        if len(utterances) <= last:
            continue

        # Add new utterances
        for i in range(last, len(utterances)):
            new_text = utterances[i].strip()
            if new_text and is_recruitment:
                chat_history.append({"role": "user", "content": new_text})

        last = len(utterances)
        turns += 1
        active_lang = state.demo_lang()
        logger.debug(
            "[demo] %s: user turn %d (greeted=%s)",
            room_name,
            turns,
            greeted,
        )

        if not greeted:
            await say_demo(room, demo_scenario_question(scenario, active_lang), active_lang)
            greeted = True
            continue

        if is_recruitment:
            meta_obj = meta or JobMetadata(scenario=scenario, language=active_lang)
            reply, ready_to_close, outcome, callback_time = await plan_recruitment_turn(
                llm, chat_history, meta_obj
            )
            if reply.strip():
                await say_demo(room, reply, active_lang)
                chat_history.append({"role": "assistant", "content": reply})

            if ready_to_close:
                from avip_agent.dialogue.recruitment_planner import extract_recruitment_details
                final_reason = await extract_recruitment_details(
                    llm, chat_history, meta_obj, final_outcome=outcome, final_callback_time=callback_time
                )
                await asyncio.sleep(DEMO_CLOSE_DELAY_SECONDS)
                await publish_data(
                    room,
                    {
                        "type": "demo_complete",
                        "scenario": scenario,
                        "answer": final_reason,
                        "lang": active_lang,
                    },
                )
                logger.info(
                    "[demo] %s: recruitment screening closed — outcome=%s",
                    room_name,
                    outcome,
                )
                return
        else:
            plan = await plan_scenario_turn_async(llm, utterances, active_lang, scenario)
            await say_demo(room, plan.reply, active_lang)
            if plan.ready_to_close:
                await asyncio.sleep(DEMO_CLOSE_DELAY_SECONDS)
                await publish_data(
                    room,
                    {
                        "type": "demo_complete",
                        "scenario": scenario,
                        "answer": plan.answer,
                        "lang": active_lang,
                    },
                )
                logger.info(
                    "[demo] %s: closed — scenario=%s answer=%r lang=%s",
                    room_name,
                    scenario,
                    plan.answer,
                    active_lang,
                )
                return

    logger.info("[demo] %s: session finished (turns=%d)", room_name, turns)


async def _echo_user_text(room: rtc.Room, line: str) -> None:
    try:
        await publish_data(room, {"type": "user_text", "text": line})
    except Exception as exc:
        logger.warning("[demo] user_text echo failed: %s", exc)


async def publish_data(room: rtc.Room, payload: dict[str, Any]) -> None:
    await room.local_participant.publish_data(
        json.dumps(payload).encode("utf-8"),
        reliable=True,
    )


async def say_demo(room: rtc.Room, text: str, lang: str) -> None:
    """Browser demo: page plays POST /demo/tts when it receives agent_text."""
    await publish_data(
        room,
        {
            "type": "agent_text",
            "text": text,
            "lang": lang,
        },
    )


def register_data_handlers(
    room: rtc.Room,
    state: JobState,
    *,
    demo_mode: bool,
) -> None:
    @room.on("data_received")
    def _on_data(data: rtc.DataPacket) -> None:
        try:
            msg = json.loads(data.data.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return
        if demo_mode:
            _handle_demo_data(room, state, msg)
            return
        line = str(msg.get("utterance") or msg.get("text") or "").strip()
        if line:
            state.add(line)


def _handle_demo_data(room: rtc.Room, state: JobState, msg: dict[str, Any]) -> None:
    msg_type = str(msg.get("type") or "")
    if msg_type == "set_language":
        state.set_demo_lang(str(msg.get("lang") or ""))
        return
    if msg_type == "utterance":
        line = str(msg.get("utterance") or msg.get("text") or "").strip()
        if not line:
            return
        state.add(line)
        asyncio.create_task(_echo_user_text(room, line))


def register_transcript_handler(session: AgentSession, state: JobState) -> None:
    @session.on("user_input_transcribed")
    def _on_transcript(event: Any) -> None:
        text = getattr(event, "transcript", None) or getattr(event, "text", "")
        if isinstance(text, str) and text.strip():
            state.add(text.strip())


def build_session(cfg: Config, meta: JobMetadata, sarvam_client: SarvamClient) -> AgentSession:
    from livekit.agents.stt import StreamAdapter
    from livekit.plugins import silero

    lang = normalize_demo_lang(meta.language or cfg.default_language)
    batch_stt = SarvamSTT(client=sarvam_client, language=lang)
    stt_engine = StreamAdapter(stt=batch_stt, vad=silero.VAD.load())
    tts_engine = SarvamTTS(client=sarvam_client, language=lang)
    return AgentSession(
        vad=silero.VAD.load(),
        stt=stt_engine,
        tts=tts_engine,
    )


async def start_session(session: AgentSession, room: rtc.Room) -> None:
    agent = Agent(instructions="Soniqa recovery voice agent.")
    await session.start(agent=agent, room=room)


