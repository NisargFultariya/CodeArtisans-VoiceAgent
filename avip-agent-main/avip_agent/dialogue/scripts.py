from __future__ import annotations

from avip_agent.dialogue.language import normalize_demo_lang


def demo_greeting_good_time(lang: str) -> str:
    match normalize_demo_lang(lang):
        case "gu-IN":
            return (
                "નમસ્તે, હું Soniqa તરફથી તમારી ડિલિવરી વિશે કૉલ કરું છું. "
                "શું હવે વાત કરવાનો સારો સમય છે?"
            )
        case "ta-IN":
            return (
                "வணக்கம், Soniqa-விலிருந்து உங்கள் டெலிவரி பற்றி நான் அழைக்கிறேன். "
                "இப்போது பேசுவது சரியா?"
            )
        case "te-IN":
            return (
                "నమస్కారం, Soniqa నుండి మీ డెలివరీ గురించి నేను కాల్ చేస్తున్నాను. "
                "ఇప్పుడు మాట్లాడటానికి సరైన సమయమా?"
            )
        case "mr-IN":
            return (
                "नमस्कार, मी Soniqa कडून तुमच्या डिलिव्हरीबद्दल कॉल करते. "
                "आत्ता बोलण्यासाठी योग्य वेळ आहे का?"
            )
        case _:
            return (
                "नमस्ते, मैं Soniqa से आपकी डिलीवरी के बारे में कॉल कर रही हूँ। "
                "क्या अभी बात करने का सही समय है?"
            )


def demo_ask_reason(lang: str) -> str:
    match normalize_demo_lang(lang):
        case "gu-IN":
            return "આભાર. કૃપા કરીને કહો, ડિલિવરી શા માટે થઈ નહીં?"
        case "ta-IN":
            return "நன்றி. டெலிவரி ஏன் வெற்றியடையவில்லை என்று சொல்லுங்கள்."
        case "te-IN":
            return "ధన్యవాదాలు. డెలివరీ ఎందుకు కాలేదో చెప్పండి."
        case "mr-IN":
            return "धन्यवाद. कृपया सांगा, डिलिव्हरी का झाली नाही?"
        case _:
            return "धन्यवाद। कृपया बताइए, डिलीवरी क्यों नहीं हो पाई?"


def demo_ask_reschedule(lang: str) -> str:
    match normalize_demo_lang(lang):
        case "gu-IN":
            return "ડિલિવરી ફરી ક્યારે અને કયા સમયે કરવી?"
        case "ta-IN":
            return "டெலிவரியை மீண்டும் எப்போது மறுபடியும் செய்யலாம்?"
        case "te-IN":
            return "డెలివరీని మళ్లీ ఎప్పుడు షెడ్యూల్ చేద్దాం?"
        case "mr-IN":
            return "डिलिव्हरी पुन्हा केव्हा आणि कोणत्या वेळी करू?"
        case _:
            return "डिलीवरी दोबारा कब और किस समय करें?"


def demo_closing_message(lang: str, reason: str, reschedule: str) -> str:
    reason = reason.strip().rstrip("।.")
    reschedule = reschedule.strip().rstrip("।.")
    match normalize_demo_lang(lang):
        case "gu-IN":
            return (
                f"આભાર! અમે તમારી ડિલિવરી {reschedule} પર રિશેડ્યૂલ કરીશું. "
                f"કારણ: {reason}. તમારો દિવસ શુભ રહે!"
            )
        case "te-IN":
            return (
                f"ధన్యవాదాలు! మేము మీ డెలివరీని {reschedule} కు రీషెడ్యూల్ చేస్తాము. "
                f"కారణం: {reason}. మంచి రోజు!"
            )
        case "ta-IN":
            return (
                f"நன்றி! உங்கள் டெலிவரியை {reschedule}-க்கு மீண்டும் திட்டமிடுவோம். "
                f"காரணம்: {reason}. நல்ல நாள்!"
            )
        case "mr-IN":
            return (
                f"धन्यवाद! आम्ही तुमची डिलिव्हरी {reschedule} ला पुन्हा शेड्यूल करू. "
                f"कारण: {reason}. तुमचा दिवस शुभ असो!"
            )
        case _:
            return (
                f"धन्यवाद! हम आपकी डिलीवरी {reschedule} पर दोबारा करेंगे। "
                f"कारण: {reason}। आपका दिन शुभ हो!"
            )
