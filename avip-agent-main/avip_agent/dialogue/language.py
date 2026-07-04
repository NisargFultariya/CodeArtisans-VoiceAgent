from __future__ import annotations

SUPPORTED_DEMO_LANGS = {
    "hi-IN": "Hindi",
    "gu-IN": "Gujarati",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "mr-IN": "Marathi",
}

DEFAULT_DEMO_LANG = "hi-IN"

RESCHEDULE_HINTS = (
    "tomorrow",
    "today",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "morning",
    "afternoon",
    "evening",
    "night",
    "pm",
    "am",
    "next week",
    "reschedule",
    "redeliver",
    "try again",
    "come again",
    "kal",
    "aaj",
    "parso",
    "shaam",
    "sham",
    "subah",
    "dopahar",
    "raat",
    "agli",
    "phir",
    "dobara",
    "કાલે",
    "આવતીકાલ",
    "સાંજ",
    "સવારે",
    "ફરી",
    "આજે",
    "नंतर",
    "उद्या",
    "संध्याकाळ",
    "सकाळ",
    "நாளை",
    "மாலை",
    "காலை",
    "రేపు",
    "సాయంత్రం",
    "ఉదయం",
)


def normalize_demo_lang(lang: str) -> str:
    lang = lang.strip()
    if lang in SUPPORTED_DEMO_LANGS:
        return lang
    return DEFAULT_DEMO_LANG


def contains_reschedule_hint(text: str) -> bool:
    lower = text.lower()
    return any(hint in lower for hint in RESCHEDULE_HINTS)
