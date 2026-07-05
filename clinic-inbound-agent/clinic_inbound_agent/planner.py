from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any

from avip_agent.openrouter import OpenRouterClient

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Turn result data types
# ---------------------------------------------------------------------------

@dataclass
class ClinicTurnPlan:
    reply: str = ""
    tool_call: dict[str, Any] | None = None   # {"name": str, "args": dict}
    ready_to_close: bool = False
    close_reason: str = ""


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

def build_system_prompt(clinic_name: str, working_hours: str, language: str = "en-IN") -> str:
    today = date.today()
    scheduling_end = today + timedelta(days=14)

    lang_note = (
        "IMPORTANT: Always respond in clear, warm, professional English. "
        "Speak naturally — you are a human-sounding receptionist."
    )

    return f"""\
You are **Riya**, a warm and professional AI receptionist at **{clinic_name}**.
Your job is to answer inbound calls and help callers book appointments.

## Clinic Information
- Clinic name: {clinic_name}
- Working hours: {working_hours}
- Slot duration: 30 minutes
- Max patients per slot: 5
- Clinic is CLOSED on Sundays
- Bookings accepted for the next 14 days (until {scheduling_end.isoformat()})

{lang_note}

## Your Responsibilities
1. Greet the caller warmly and determine their need.
2. If they want to book an appointment:
   a. Ask which date works for them.
   b. ALWAYS call `check_availability` before proposing any slot — never guess.
   c. Offer an available slot and confirm the date + time EXPLICITLY before booking.
   d. Capture their name and confirm the phone number to send the payment link.
   e. Call `hold_slot` ONLY after explicit verbal confirmation.
   f. Then call `end_call_with_summary` to wrap up.
3. If the clinic is closed that day or no slots remain, offer alternatives.

## STT Transcription Issues
The speech-to-text may produce garbled text. If a response is unclear:
- Politely say: "I'm sorry, I didn't catch that. Could you repeat that?"
- Never assume a date/time from garbled speech.

## Handling Edge Cases
- **Sunday request**: "Our clinic is closed on Sundays. Would Monday or Saturday work for you?"
- **Fully booked slot**: "That slot is fully booked. Let me check the next available time."
- **Date too far out or past**: Explain the booking window.
- **Vague request** ("sometime next week"): Ask a narrowing question — "Do you have a preference for morning or afternoon?"
- **Long silence / no response**: Re-prompt once. After a second silence, politely end the call.
- **Caller wants to change slot mid-call**: Release the existing hold before creating a new one.

## Confirmation Rule — CRITICAL
Before calling `hold_slot`, you MUST say something like:
"Just to confirm — [Weekday], [date], [time] — shall I book that for you?"
Only proceed with the hold after the caller says YES.

## Payment & Closing
After holding the slot, tell the caller:
"I'll send a payment link to [phone number]. Once you complete the payment, 
your appointment will be confirmed. Is there anything else I can help you with?"
Then call `end_call_with_summary`.

## Duplicate Bookings
If the system reports the caller already has a booking for that slot, let them know
and ask if they'd like a different slot.

## Output Format — CRITICAL
You MUST always respond with a valid JSON object. No markdown, no extra text.
Structure:
{{
  "reply": "Your conversational response to speak aloud",
  "tool_call": {{"name": "<tool_name>", "args": {{...}}}} or null,
  "ready_to_close": false,
  "close_reason": null
}}

Available tools:
- `check_availability` — args: {{"date": "YYYY-MM-DD"}}
- `hold_slot` — args: {{"date": "YYYY-MM-DD", "time": "HH:MM", "caller_phone": "+91xxxxxxxxxx", "caller_name": "Name"}}
- `end_call_with_summary` — args: {{"outcome": "booked|no_slots|caller_declined|other", "hold_id": "<id or null>", "summary": "one sentence"}}

When you call a tool, set `reply` to the thing you will say BEFORE the tool executes.
When tool results come back, continue the conversation from there.
Set `ready_to_close = true` ONLY when calling `end_call_with_summary`.
"""


# ---------------------------------------------------------------------------
# Planner
# ---------------------------------------------------------------------------

async def plan_clinic_turn(
    llm: OpenRouterClient,
    chat_history: list[dict[str, str]],
    tool_results: list[dict[str, Any]],
    clinic_name: str,
    language: str = "en-IN",
) -> ClinicTurnPlan:
    """
    Generate the next agent turn.
    Follows the same JSON-in-text pattern as recruitment_planner.py.
    """
    system_prompt = build_system_prompt(clinic_name, "10:00–18:00", language)

    # Build transcript string
    transcript_lines = []
    for msg in chat_history:
        role = "Riya" if msg["role"] == "assistant" else "Caller"
        transcript_lines.append(f"{role}: {msg['content']}")

    transcript_str = "\n".join(transcript_lines)

    # Append tool results if any
    tool_context = ""
    if tool_results:
        tool_context = "\n\n## Tool Results (use these to inform your reply)\n"
        for tr in tool_results:
            tool_context += f"- {tr['tool']}: {json.dumps(tr['result'])}\n"

    user_prompt = (
        f"Conversation so far:\n{transcript_str}{tool_context}\n\n"
        "Generate Riya's next response as JSON."
    )

    raw = ""
    try:
        raw = await llm.chat(system_prompt, user_prompt)
        raw = raw.strip()
        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?", "", raw).strip()
        raw = re.sub(r"```$", "", raw).strip()

        data = json.loads(raw)

        tool_call = data.get("tool_call")
        if tool_call and not isinstance(tool_call, dict):
            tool_call = None
        if tool_call and not tool_call.get("name"):
            tool_call = None

        return ClinicTurnPlan(
            reply=str(data.get("reply") or "").strip(),
            tool_call=tool_call,
            ready_to_close=bool(data.get("ready_to_close")),
            close_reason=str(data.get("close_reason") or ""),
        )
    except Exception as exc:
        logger.error("plan_clinic_turn error: %s | raw=%r", exc, raw)
        # Safe fallback
        return ClinicTurnPlan(
            reply="I'm sorry, I didn't catch that. Could you repeat what you said?",
            tool_call=None,
            ready_to_close=False,
        )
