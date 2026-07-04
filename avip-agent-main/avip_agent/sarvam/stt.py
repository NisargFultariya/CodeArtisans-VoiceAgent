from __future__ import annotations

import uuid

from livekit import rtc
from livekit.agents import stt
from livekit.agents.types import APIConnectOptions, DEFAULT_API_CONNECT_OPTIONS, NOT_GIVEN, NotGivenOr
from livekit.agents.utils import AudioBuffer

from avip_agent.sarvam.client import SarvamClient, frames_to_wav


class SarvamSTT(stt.STT):
    def __init__(self, *, client: SarvamClient, language: str = "hi-IN") -> None:
        super().__init__(
            capabilities=stt.STTCapabilities(
                streaming=False,
                interim_results=False,
                offline_recognize=True,
            )
        )
        self._client = client
        self._language = language

    @property
    def model(self) -> str:
        return "saaras:v3"

    @property
    def provider(self) -> str:
        return "Sarvam"

    async def _recognize_impl(
        self,
        buffer: AudioBuffer,
        *,
        language: NotGivenOr[str] = NOT_GIVEN,
        conn_options: APIConnectOptions,
    ) -> stt.SpeechEvent:
        _ = conn_options
        lang = language if language is not NOT_GIVEN and language else self._language
        wav = frames_to_wav(buffer, sample_rate=16000)
        text = await self._client.transcribe_wav(wav, lang)
        return stt.SpeechEvent(
            type=stt.SpeechEventType.FINAL_TRANSCRIPT,
            request_id=str(uuid.uuid4()),
            alternatives=[
                stt.SpeechData(language=lang, text=text),
            ],
        )

    async def aclose(self) -> None:
        await self._client.aclose()
