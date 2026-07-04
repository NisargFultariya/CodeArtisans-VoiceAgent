from __future__ import annotations

import pytest


class FakeLLM:
    """Stub OpenRouter client for turn-planner tests."""

    def __init__(self, response: str) -> None:
        self._response = response
        self.calls: list[tuple[str, str]] = []

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        model: str | None = None,
    ) -> str:
        self.calls.append((system_prompt, user_prompt))
        return self._response

    async def aclose(self) -> None:
        return None
