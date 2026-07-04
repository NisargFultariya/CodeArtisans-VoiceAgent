from __future__ import annotations

import threading

from avip_agent.dialogue.language import normalize_demo_lang
from avip_agent.dialogue.scenarios import normalize_scenario


class JobState:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._utterances: list[str] = []
        self._demo_lang = ""
        self._demo_scenario = normalize_scenario("")

    def add(self, text: str) -> None:
        text = " ".join(text.strip().split())
        if not text:
            return
        with self._lock:
            self._utterances.append(text)

    def list(self) -> list[str]:
        with self._lock:
            return list(self._utterances)

    def set_demo_lang(self, lang: str) -> None:
        with self._lock:
            self._demo_lang = normalize_demo_lang(lang)

    def demo_lang(self) -> str:
        with self._lock:
            return self._demo_lang or "hi-IN"

    def set_demo_scenario(self, scenario: str) -> None:
        with self._lock:
            self._demo_scenario = normalize_scenario(scenario)

    def demo_scenario(self) -> str:
        with self._lock:
            return self._demo_scenario
