from __future__ import annotations

from avip_agent.dialogue.scenarios import normalize_scenario

# What each browser demo scenario is trying to capture (for LLM context).
_SCENARIO_GOALS: dict[str, str] = {
    "landmark": (
        "Collect a nearby landmark or helpful direction so the delivery person "
        "can find the address."
    ),
    "availability": (
        "Confirm the customer will be at the delivery address tomorrow "
        "between 10 AM and 5 PM."
    ),
    "payment": "Confirm whether the customer will pay cash or via UPI on delivery.",
    "backup_contact": (
        "Collect an alternate phone number to call if the primary number "
        "does not connect."
    ),
    "impulse_modification": (
        "Check if the customer wants to change size or color before dispatch."
    ),
}

_SCRIPT_HINTS: dict[str, str] = {
    "hi-IN": "Write the reply in Hindi using Devanagari script only.",
    "gu-IN": "Write the reply in Gujarati script.",
    "ta-IN": "Write the reply in Tamil script.",
    "te-IN": "Write the reply in Telugu script.",
    "mr-IN": "Write the reply in Marathi Devanagari script.",
    "kn-IN": "Write the reply in Kannada script.",
}


def scenario_goal(scenario: str) -> str:
    key = normalize_scenario(scenario)
    return _SCENARIO_GOALS[key]


def reply_script_hint(lang: str) -> str:
    return _SCRIPT_HINTS.get(lang, "Match the customer's language and script.")
