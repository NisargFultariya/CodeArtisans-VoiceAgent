from __future__ import annotations

from avip_agent.dialogue.language import normalize_demo_lang

# TRAI AI disclosure — prepended to the first spoken utterance (~first 3 seconds).
_TRAI_PREFIX = {
    "hi-IN": "यह एक AI द्वारा संचालित कॉल है। ",
    "gu-IN": "આ AI દ્વારા સંચાલિત કૉલ છે. ",
    "ta-IN": "இது AI மூலம் இயக்கப்படும் அழைப்பு. ",
    "te-IN": "ఇది AI ద్వారా నిర్వహించబడిన కాల్. ",
    "mr-IN": "ही AI द्वारे चालवली जाणारी कॉल आहे. ",
}


def with_trai_disclosure(text: str, lang: str) -> str:
    text = text.strip()
    if not text:
        return text
    prefix = _TRAI_PREFIX.get(normalize_demo_lang(lang), _TRAI_PREFIX["hi-IN"])
    if text.startswith(prefix.strip()):
        return text
    return f"{prefix}{text}"
