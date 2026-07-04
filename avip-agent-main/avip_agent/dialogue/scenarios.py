from __future__ import annotations

from avip_agent.dialogue.language import normalize_demo_lang

VALID_SCENARIOS = (
    "landmark",
    "availability",
    "payment",
    "backup_contact",
    "impulse_modification",
    "recruitment",
    "hr",
    "screening",
)

_DEFAULT_SCENARIO = "availability"

# Matrubhasha / NDR prevention scripts (transliterated for voice).
_QUESTIONS: dict[str, dict[str, str]] = {
    "landmark": {
        "hi-IN": "Delivery boy ke liye koi aas-paas ka landmark bata sakte hain?",
        "ta-IN": "Delivery boy-ku eathavathu landmark solla mudiyuma?",
        "te-IN": "Delivery boy kosam edaina landmark cheppagalara?",
        "kn-IN": "Delivery boy ge yavudadaru landmark helutira?",
        "gu-IN": "Delivery boy mate koi najik nu landmark kahi shako?",
        "mr-IN": "Delivery boy sathi kahi javalcha landmark sanga shakta ka?",
    },
    "availability": {
        "hi-IN": "क्या आप कल सुबह दस से पाँच बजे के बीच इस पते पर मिलेंगे?",
        "ta-IN": "Naalai kaalai pathu mani muthal anju mani varai intha address-la iruppingala?",
        "te-IN": "Repu podduna padi nunchi aaidu gantalaloppu ee address lo untara?",
        "kn-IN": "Nale beligge hattu rinda aaidu gante olage ee address nalli irtira?",
        "gu-IN": "Shu tamhe kaale savare das thi paanch vage sudhi aa address par malsho?",
        "mr-IN": "Udya sakali das te pach ya veli ya address var upasthit asaal ka?",
    },
    "payment": {
        "hi-IN": "Aap cash denge ya delivery wale ko UPI se pay karenge?",
        "ta-IN": "Neenga cash kudukkaringala illa delivery person-ku UPI panringala?",
        "te-IN": "Meeru cash isthara leka delivery person ki UPI chesthara?",
        "kn-IN": "Neevu cash kodutira athava delivery person ge UPI madutira?",
        "gu-IN": "Tamhe cash aapsho ke delivery person ne UPI thi pay karsho?",
        "mr-IN": "Tumhi cash dyal ka ki delivery person la UPI ne pay karal?",
    },
    "backup_contact": {
        "hi-IN": (
            "Agar aapka number nahi laga, toh kya koi aur number de sakte hain "
            "jispar hum call kar sakein?"
        ),
        "ta-IN": "Unga number reach aagala na, vera number eathavathu irukka?",
        "te-IN": "Mee number kalavakapothe, vere number edaina isthara?",
        "kn-IN": "Nimma number reach agilla andre, bere number yavudadaru idya?",
        "gu-IN": "Jo tamaro number na lage, to koi bijo number aapisho jena par call kari shakiye?",
        "mr-IN": "Jevha tumcha number lagat nahi, tar dusra number deta ka jyavar call karu shakto?",
    },
    "impulse_modification": {
        "hi-IN": "Dispatch hone se pehle, kya aapko size ya color change karna hai?",
        "ta-IN": "Anuppurathukku munnadi, size illana color eathavathu maathanuma?",
        "te-IN": "Pampinche mundu, size leka color emaina marchala?",
        "kn-IN": "Kaluhisuva munna, size athava color enadaru change madbeka?",
        "gu-IN": "Dispatch pahela, tamne size ke color change karvu che?",
        "mr-IN": "Dispatch honya adhi, tumhala size kinva color badalaycha aahe ka?",
    },
}

_CLOSINGS: dict[str, dict[str, str]] = {
    "landmark": {
        "hi-IN": "Dhanyavaad! Humne aapka landmark note kar liya: {answer}. Aapka din shubh ho!",
        "ta-IN": "Nandri! Ungal landmark note pannitten: {answer}. Nalla naal!",
        "te-IN": "Dhanyavaadalu! Mee landmark note chesanu: {answer}. Manchi roju!",
        "kn-IN": "Dhanyavaadagalu! Nimma landmark note maadidenu: {answer}. Shubha din!",
        "gu-IN": "Aabhar! Amne tamaro landmark note karyo: {answer}. Shubh divas!",
        "mr-IN": "Dhanyavaad! Amhi tumcha landmark note kela: {answer}. Shubh divas!",
    },
    "availability": {
        "hi-IN": (
            "धन्यवाद! हमने आपकी उपलब्धता नोट कर ली है। "
            "कल सुबह दस से पाँच बजे के बीच डिलीवरी शेड्यूल करेंगे। आपका दिन शुभ हो!"
        ),
        "ta-IN": "Nandri! Delivery {answer} ku schedule seivom. Nalla naal!",
        "te-IN": "Dhanyavaadalu! Delivery ni {answer} ki schedule chestham. Manchi roju!",
        "kn-IN": "Dhanyavaadagalu! Delivery na {answer} ge schedule maadutteve. Shubha din!",
        "gu-IN": "Aabhar! Am delivery {answer} par schedule karshu. Shubh divas!",
        "mr-IN": "Dhanyavaad! Amhi delivery {answer} la schedule karu. Shubh divas!",
    },
    "payment": {
        "hi-IN": "Dhanyavaad! Humne note kar liya aap {answer} se pay karenge. Aapka din shubh ho!",
        "ta-IN": "Nandri! Neenga {answer} pay pannuviri nu note pannitten. Nalla naal!",
        "te-IN": "Dhanyavaadalu! Meeru {answer} tho pay chestharu ani note chesanu. Manchi roju!",
        "kn-IN": "Dhanyavaadagalu! Neevu {answer} moolaka pay maadutira endu note maadidenu. Shubha din!",
        "gu-IN": "Aabhar! Tamhe {answer} thi pay karsho e note karyu. Shubh divas!",
        "mr-IN": "Dhanyavaad! Tumhi {answer} ne pay karal he note kele. Shubh divas!",
    },
    "backup_contact": {
        "hi-IN": "Dhanyavaad! Backup number note kar liya: {answer}. Aapka din shubh ho!",
        "ta-IN": "Nandri! Backup number note pannitten: {answer}. Nalla naal!",
        "te-IN": "Dhanyavaadalu! Backup number note chesanu: {answer}. Manchi roju!",
        "kn-IN": "Dhanyavaadagalu! Backup number note maadidenu: {answer}. Shubha din!",
        "gu-IN": "Aabhar! Backup number note karyo: {answer}. Shubh divas!",
        "mr-IN": "Dhanyavaad! Backup number note kela: {answer}. Shubh divas!",
    },
    "impulse_modification": {
        "hi-IN": "Dhanyavaad! Humne note kar liya: {answer}. Aapka din shubh ho!",
        "ta-IN": "Nandri! Note pannitten: {answer}. Nalla naal!",
        "te-IN": "Dhanyavaadalu! Note chesanu: {answer}. Manchi roju!",
        "kn-IN": "Dhanyavaadagalu! Note maadidenu: {answer}. Shubha din!",
        "gu-IN": "Aabhar! Note karyu: {answer}. Shubh divas!",
        "mr-IN": "Dhanyavaad! Note kele: {answer}. Shubh divas!",
    },
}


def normalize_scenario(scenario: str) -> str:
    key = (scenario or "").strip().lower().replace("-", "_")
    if key in VALID_SCENARIOS:
        return key
    return _DEFAULT_SCENARIO


def demo_scenario_question(scenario: str, lang: str) -> str:
    scenario = normalize_scenario(scenario)
    lang = normalize_demo_lang(lang)
    return _QUESTIONS[scenario].get(lang) or _QUESTIONS[scenario]["hi-IN"]


def demo_scenario_closing(scenario: str, lang: str, answer: str) -> str:
    scenario = normalize_scenario(scenario)
    lang = normalize_demo_lang(lang)
    answer = answer.strip().rstrip(".,!?।")
    template = _CLOSINGS[scenario].get(lang) or _CLOSINGS[scenario]["hi-IN"]
    if scenario == "availability" and lang == "hi-IN":
        return template
    return template.format(answer=answer or "—")
