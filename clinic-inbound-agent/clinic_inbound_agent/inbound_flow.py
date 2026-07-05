from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import httpx
from livekit import rtc
from livekit.agents import AgentSession

# Reuse SDK modules unchanged
from avip_agent.openrouter import OpenRouterClient
from avip_agent.session.participants import remote_participants
from avip_agent.session.speech import say
from avip_agent.job_state import JobState

from clinic_inbound_agent.config import ClinicConfig
from clinic_inbound_agent.tools import ClinicAPIClient, HoldResult, SlotInfo
from clinic_inbound_agent.planner import plan_clinic_turn, ClinicTurnPlan
from clinic_inbound_agent.call_log import log_call

logger = logging.getLogger(__name__)

MAX_TURNS = 25
SESSION_TIMEOUT_SECONDS = 360  # 6 minutes
SILENCE_REPROMPT_SECONDS = 8.0
SILENCE_MAX_REPROMPTS = 2
POLL_INTERVAL = 0.4
ALONE_TICKS_EXIT = 3  # ~1.2s after caller hangs up


async def run_inbound_flow(
    room: rtc.Room,
    session: AgentSession,
    state: JobState,
    llm: OpenRouterClient,
    cfg: ClinicConfig,
    caller_phone: str,
) -> None:
    """
    Main inbound conversation loop.
    - Speaks greeting first (agent initiates).
    - Runs turn-taking loop with tool dispatch.
    - Handles silence, hangup, hold management, payment link SMS.
    """
    clinic_client = ClinicAPIClient(cfg.clinic_backend_url)
    room_name = room.name

    chat_history: list[dict[str, str]] = []
    transcript: list[dict[str, str]] = []  # for call log
    pending_hold: HoldResult | None = None
    outcome = "unknown"
    hold_id_for_log: str | None = None

    # ------------------------------------------------------------------ #
    # Step 1: Greet the caller
    # ------------------------------------------------------------------ #
    greeting = (
        f"Thank you for calling {cfg.clinic_name}, this is Riya. "
        "How can I help you today?"
    )
    await say(session, greeting)
    chat_history.append({"role": "assistant", "content": greeting})
    transcript.append({"role": "assistant", "text": greeting})
    logger.info("[clinic] %s: greeting spoken", room_name)

    # ------------------------------------------------------------------ #
    # Step 2: Turn loop
    # ------------------------------------------------------------------ #
    last_utterance_count = 0
    turns = 0
    alone_ticks = 0
    silence_seconds = 0.0
    silence_reprompts = 0
    deadline = time.monotonic() + SESSION_TIMEOUT_SECONDS
    pending_tool_results: list[dict[str, Any]] = []

    try:
        while time.monotonic() < deadline and turns < MAX_TURNS:
            await asyncio.sleep(POLL_INTERVAL)

            # -- Caller hangup detection --
            if not remote_participants(room):
                alone_ticks += 1
                if alone_ticks >= ALONE_TICKS_EXIT:
                    logger.info("[clinic] %s: caller hung up", room_name)
                    # If hold exists, it will expire on its own — do NOT release
                    # so SMS can still be sent if we were mid-closing
                    outcome = "caller_disconnected"
                    if pending_hold:
                        # Attempt to send SMS even after disconnect
                        await _send_payment_sms(cfg, pending_hold, room_name)
                    break
                continue
            alone_ticks = 0

            utterances = state.list()
            new_count = len(utterances)

            # -- Silence detection --
            if new_count <= last_utterance_count:
                silence_seconds += POLL_INTERVAL

                if silence_seconds >= SILENCE_REPROMPT_SECONDS:
                    silence_reprompts += 1
                    silence_seconds = 0.0

                    if silence_reprompts == 1:
                        reprompt = "Sorry, I didn't hear a response. Could you repeat that?"
                        await say(session, reprompt)
                        chat_history.append({"role": "assistant", "content": reprompt})
                        transcript.append({"role": "assistant", "text": reprompt})
                        continue

                    if silence_reprompts >= SILENCE_MAX_REPROMPTS:
                        farewell = (
                            "I didn't hear a response, so I'll end the call here. "
                            "Please call us back whenever you're ready. Goodbye!"
                        )
                        await say(session, farewell)
                        transcript.append({"role": "assistant", "text": farewell})
                        outcome = "no_response"
                        break
                continue

            # User spoke — reset silence
            silence_seconds = 0.0
            silence_reprompts = 0

            # Add new utterances to chat history
            for i in range(last_utterance_count, new_count):
                text = utterances[i].strip()
                if text:
                    chat_history.append({"role": "user", "content": text})
                    transcript.append({"role": "user", "text": text})
                    logger.info("[clinic] %s caller (turn %d): %r", room_name, turns + 1, text)

            last_utterance_count = new_count
            turns += 1

            # -- LLM turn --
            plan = await plan_clinic_turn(
                llm=llm,
                chat_history=chat_history,
                tool_results=pending_tool_results,
                clinic_name=cfg.clinic_name,
                language=cfg.language,
            )
            pending_tool_results = []

            # Speak the reply (may be pre-tool or standalone)
            if plan.reply:
                await say(session, plan.reply)
                chat_history.append({"role": "assistant", "content": plan.reply})
                transcript.append({"role": "assistant", "text": plan.reply})
                silence_seconds = 0.0

            # -- Tool dispatch --
            if plan.tool_call:
                tool_result = await _dispatch_tool(
                    plan.tool_call,
                    cfg=cfg,
                    clinic_client=clinic_client,
                    session=session,
                    chat_history=chat_history,
                    transcript=transcript,
                    pending_hold=pending_hold,
                    caller_phone=caller_phone,
                )

                tool_name = plan.tool_call.get("name", "")

                # Update pending_hold state
                if tool_name == "hold_slot" and isinstance(tool_result.get("result"), dict):
                    r = tool_result["result"]
                    if r.get("hold_id"):
                        pending_hold = HoldResult(
                            hold_id=r["hold_id"],
                            expires_at=r.get("expires_at", ""),
                            date=r.get("date", ""),
                            time=r.get("time", ""),
                            caller_phone=r.get("caller_phone", caller_phone),
                            caller_name=r.get("caller_name", ""),
                        )
                        hold_id_for_log = pending_hold.hold_id

                # Release old hold if caller asks to change slot
                if tool_name == "hold_slot" and pending_hold and tool_result.get("result", {}).get("hold_id"):
                    new_hold_id = tool_result["result"]["hold_id"]
                    if new_hold_id != pending_hold.hold_id:
                        await clinic_client.release_hold(pending_hold.hold_id)
                        logger.info("[clinic] released old hold %s (caller changed slot)", pending_hold.hold_id)

                if tool_name == "end_call_with_summary":
                    outcome = (plan.tool_call.get("args") or {}).get("outcome", "completed")
                    break

                # Feed tool result back into next turn
                pending_tool_results.append(tool_result)

            elif plan.ready_to_close:
                outcome = plan.close_reason or "completed"
                break

        # ------------------------------------------------------------------ #
        # Step 3: Post-call — send payment SMS if hold exists
        # ------------------------------------------------------------------ #
        if pending_hold and outcome not in ("caller_disconnected",):
            await _send_payment_sms(cfg, pending_hold, room_name)

    finally:
        await clinic_client.aclose()

        # Log the call
        log_call(
            room_name=room_name,
            caller_phone=caller_phone,
            transcript=transcript,
            hold_id=hold_id_for_log,
            outcome=outcome,
        )
        logger.info("[clinic] %s: call ended outcome=%s turns=%d", room_name, outcome, turns)


# ---------------------------------------------------------------------------
# Tool dispatcher
# ---------------------------------------------------------------------------

async def _dispatch_tool(
    tool_call: dict[str, Any],
    *,
    cfg: ClinicConfig,
    clinic_client: ClinicAPIClient,
    session: AgentSession,
    chat_history: list[dict],
    transcript: list[dict],
    pending_hold: HoldResult | None,
    caller_phone: str,
) -> dict[str, Any]:
    name = tool_call.get("name", "")
    args = tool_call.get("args") or {}

    if name == "check_availability":
        return await _tool_check_availability(args, clinic_client)

    elif name == "hold_slot":
        return await _tool_hold_slot(
            args, clinic_client, cfg, session, chat_history, transcript,
            pending_hold, caller_phone
        )

    elif name == "end_call_with_summary":
        return {"tool": name, "result": {"acknowledged": True}}

    else:
        logger.warning("[clinic] unknown tool requested: %s", name)
        return {"tool": name, "result": {"error": f"Unknown tool: {name}"}}


async def _tool_check_availability(
    args: dict,
    clinic_client: ClinicAPIClient,
) -> dict[str, Any]:
    date_str = args.get("date", "")
    try:
        slots = await clinic_client.check_availability(date_str)
        available = [
            {"time": s.time, "available": s.available, "capacity": s.capacity}
            for s in slots
            if s.available > 0
        ]
        full = [
            {"time": s.time}
            for s in slots
            if s.available == 0
        ]
        return {
            "tool": "check_availability",
            "result": {
                "date": date_str,
                "available_slots": available,
                "full_slots": full,
                "has_availability": len(available) > 0,
            },
        }
    except ValueError as exc:
        return {"tool": "check_availability", "result": {"error": str(exc)}}
    except RuntimeError as exc:
        logger.error("[clinic] check_availability error: %s", exc)
        return {"tool": "check_availability", "result": {"error": "Service temporarily unavailable."}}


async def _tool_hold_slot(
    args: dict,
    clinic_client: ClinicAPIClient,
    cfg: ClinicConfig,
    session: AgentSession,
    chat_history: list[dict],
    transcript: list[dict],
    pending_hold: HoldResult | None,
    caller_phone: str,
) -> dict[str, Any]:
    date_str = args.get("date", "")
    time_str = args.get("time", "")
    phone = args.get("caller_phone") or caller_phone
    name = args.get("caller_name", "Patient")

    # Release any existing hold before creating a new one
    if pending_hold and pending_hold.hold_id:
        await clinic_client.release_hold(pending_hold.hold_id)
        logger.info("[clinic] released previous hold %s before new hold", pending_hold.hold_id)

    try:
        hold = await clinic_client.hold_slot(date_str, time_str, phone, name)
        return {
            "tool": "hold_slot",
            "result": {
                "hold_id": hold.hold_id,
                "expires_at": hold.expires_at,
                "date": hold.date,
                "time": hold.time,
                "caller_phone": hold.caller_phone,
                "caller_name": hold.caller_name,
                "success": True,
            },
        }
    except ValueError as exc:
        msg = str(exc)
        return {
            "tool": "hold_slot",
            "result": {"success": False, "error": msg},
        }
    except RuntimeError as exc:
        logger.error("[clinic] hold_slot error: %s", exc)
        return {
            "tool": "hold_slot",
            "result": {"success": False, "error": "Booking service temporarily unavailable."},
        }


# ---------------------------------------------------------------------------
# Payment SMS
# ---------------------------------------------------------------------------

async def _send_payment_sms(
    cfg: ClinicConfig,
    hold: HoldResult,
    room_name: str,
) -> None:
    """Create a Razorpay payment link and send it via SMS."""
    try:
        # Create payment link via payments service
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{cfg.payments_service_url}/payments/create-link",
                json={
                    "hold_id": hold.hold_id,
                    "caller_phone": hold.caller_phone,
                    "caller_name": hold.caller_name,
                    "date": hold.date,
                    "time": hold.time,
                    "amount_paise": cfg.booking_fee_paise,
                    "clinic_name": cfg.clinic_name,
                },
            )
            if resp.status_code not in (200, 201):
                logger.error(
                    "[clinic] create-link failed %s: %s",
                    resp.status_code, resp.text
                )
                return
            link_data = resp.json()
            payment_url = link_data.get("short_url") or link_data.get("payment_url", "")

        if payment_url:
            logger.info(
                "[clinic] %s: payment link created %s for hold %s",
                room_name, payment_url, hold.hold_id,
            )
        else:
            logger.warning("[clinic] %s: payment link empty", room_name)

    except Exception as exc:
        logger.error("[clinic] %s: payment SMS error: %s", room_name, exc)


# ---------------------------------------------------------------------------
# Caller phone extraction
# ---------------------------------------------------------------------------

def extract_caller_phone(room: rtc.Room) -> str:
    """
    Try to extract caller phone from SIP participant attributes or identity.
    LiveKit SIP participants often have their phone in their identity like
    'sip_+919876543210' or in metadata attributes.
    """
    for p in room.remote_participants.values():
        # SIP participant identity commonly: "sip_+919876543210" or "+919876543210"
        identity = p.identity or ""
        if identity.startswith("sip_"):
            candidate = identity[4:]
            if candidate.startswith("+") or candidate.startswith("0") or candidate.isdigit():
                return candidate
        if identity.startswith("+"):
            return identity
        # Check participant attributes (LiveKit SIP sets these)
        attrs = dict(p.attributes or {})
        for key in ("phoneNumber", "phone_number", "caller_id", "from"):
            if attrs.get(key):
                return attrs[key]
    return "unknown"
