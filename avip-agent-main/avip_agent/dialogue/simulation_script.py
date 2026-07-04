from __future__ import annotations

from avip_agent.dialogue.language import normalize_demo_lang

# Scripted customer lines for merchant simulation (no PSTN caller).
_LINES: dict[str, list[str]] = {
    "hi-IN": ["हाँ, बोलिए", "मैं घर पर नहीं था", "कल शाम 6 बजे"],
    "gu-IN": ["હા, બોલો", "હું ઘરે નહોતો", "કાલે સાંજે 6 વાગ્યે"],
    "en-IN": ["Yes, go ahead", "I was not at home", "Tomorrow at 6 PM"],
}


def customer_lines_for(lang: str) -> list[str]:
    return list(_LINES.get(normalize_demo_lang(lang), _LINES["hi-IN"]))
