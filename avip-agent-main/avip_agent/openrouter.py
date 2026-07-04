from __future__ import annotations

import httpx


class OpenRouterClient:
    def __init__(self, api_key: str, *, model: str = "openai/gpt-4o-mini") -> None:
        self._api_key = api_key
        self._model = model if model else "openai/gpt-4o-mini"
        self._client = httpx.AsyncClient(timeout=60.0)

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        model: str | None = None,
    ) -> str:
        response = await self._client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model or self._model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
        )
        response.raise_for_status()
        payload = response.json()
        choices = payload.get("choices") or []
        if not choices:
            raise RuntimeError("openrouter: empty response")
        content = choices[0].get("message", {}).get("content", "")
        return str(content).strip()

    async def aclose(self) -> None:
        await self._client.aclose()
