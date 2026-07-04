from __future__ import annotations

import uuid

from livekit import rtc
from livekit.agents import tts
from livekit.agents.tts import AudioEmitter, ChunkedStream
from livekit.agents.types import APIConnectOptions, DEFAULT_API_CONNECT_OPTIONS

from avip_agent.sarvam.client import SarvamClient, wav_to_pcm


class SarvamTTS(tts.TTS):
    def __init__(self, *, client: SarvamClient, language: str = "hi-IN") -> None:
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=24000,
            num_channels=1,
        )
        self._client = client
        self._language = language

    @property
    def model(self) -> str:
        return "bulbul:v3"

    @property
    def provider(self) -> str:
        return "Sarvam"

    def synthesize(
        self,
        text: str,
        *,
        conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS,
    ) -> ChunkedStream:
        return _SarvamChunkedStream(
            tts=self,
            input_text=text,
            conn_options=conn_options,
            client=self._client,
            language=self._language,
        )

    async def aclose(self) -> None:
        await self._client.aclose()


class _SarvamChunkedStream(ChunkedStream):
    def __init__(
        self,
        *,
        tts: SarvamTTS,
        input_text: str,
        conn_options: APIConnectOptions,
        client: SarvamClient,
        language: str,
    ) -> None:
        super().__init__(tts=tts, input_text=input_text, conn_options=conn_options)
        self._client = client
        self._language = language

    async def _run(self, output_emitter: AudioEmitter) -> None:
        wav = await self._client.synthesize(self._input_text, self._language)
        pcm, sample_rate, num_channels = wav_to_pcm(wav)
        request_id = str(uuid.uuid4())
        output_emitter.initialize(
            request_id=request_id,
            sample_rate=sample_rate,
            num_channels=num_channels,
            mime_type="audio/pcm",
        )
        output_emitter.push(pcm)
        output_emitter.flush()
