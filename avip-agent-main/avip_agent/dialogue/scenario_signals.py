from __future__ import annotations

import re
import unicodedata

from avip_agent.dialogue.scenarios import normalize_scenario

_AFFIRMATIVES = {
    "ha",
    "haan",
    "han",
    "yes",
    "ok",
    "okay",
    "हां",
    "हाँ",
    "हो",
    "जी",
    "ji",
}

_AVAILABILITY_HINTS = (
    "मिलू",
    "milu",
    "milung",
    "rahung",
    "rahoung",
    "rahunga",
    "available",
    "avail",
    "उपलब्ध",
    "उपस्थित",
    "होऊ",
    "houng",
    "hounga",
    "milenge",
    "milenge",
    "घर पर",
    "ghar par",
    "address par",
    "पते पर",
)

_CLARIFY_HINTS = (
    "कौन",
    "kaun",
    "kahan",
    "कहाँ",
    "कहां",
    "which address",
    "kis pate",
    "kis address",
    "konsa pata",
    "konsa address",
    "pata kya",
    "address kya",
)


def _letter_count(text: str) -> int:
    return sum(1 for ch in text if unicodedata.category(ch).startswith("L"))


def normalize_token(text: str) -> str:
    return text.strip().strip(".,!?।").lower()


def is_affirmative(text: str) -> bool:
    cleaned = normalize_token(text)
    if not cleaned:
        return False
    if cleaned in _AFFIRMATIVES:
        return True
    if _letter_count(cleaned) <= 4 and any(cleaned.startswith(a) for a in _AFFIRMATIVES):
        return True
    return False


def is_clarifying_question(text: str) -> bool:
    lower = text.lower()
    if "?" in text:
        return True
    return any(hint in lower for hint in _CLARIFY_HINTS)


def is_availability_signal(text: str) -> bool:
    lower = text.lower()
    if is_affirmative(text):
        return True
    return any(hint in lower for hint in _AVAILABILITY_HINTS)


def summarize_availability_answer(lines: list[str]) -> str:
    kept: list[str] = []
    for line in lines:
        text = line.strip()
        if not text or is_clarifying_question(text):
            continue
        if text not in kept:
            kept.append(text)
    if not kept:
        return ""
    if len(kept) == 1:
        return kept[0]
    # Prefer the longest location/detail plus a trailing yes if present.
    detail = max(kept, key=len)
    if any(is_affirmative(x) for x in kept) and not is_affirmative(detail):
        return f"{detail}; confirmed"
    return detail


def infer_answer_for_scenario(scenario: str, substantive: list[str]) -> str:
    scenario = normalize_scenario(scenario)
    if not substantive:
        return ""

    if scenario == "availability":
        if any(is_availability_signal(line) for line in substantive):
            return summarize_availability_answer(substantive)
        if len(substantive) >= 2:
            return substantive[-1]
        if len(substantive[0]) >= 8:
            return substantive[0]
        return ""

    if len(substantive) >= 2:
        return substantive[-1]
    if len(substantive) == 1 and len(substantive[0]) >= 12:
        return substantive[0]
    return ""


def clarify_reply_for_scenario(scenario: str, lang: str) -> str:
    scenario = normalize_scenario(scenario)
    if scenario == "availability" and lang == "hi-IN":
        return (
            "हम आपके ऑर्डर वाले पते पर डिलीवरी करेंगे — जो आपके अकाउंट में दर्ज है। "
            "क्या आप कल सुबह दस से पाँच बजे के बीच वहाँ उपलब्ध रहेंगे?"
        )
    if scenario == "availability":
        return (
            "We will deliver to the address on your order. "
            "Will you be available there tomorrow between 10 AM and 5 PM?"
        )
    return ""
