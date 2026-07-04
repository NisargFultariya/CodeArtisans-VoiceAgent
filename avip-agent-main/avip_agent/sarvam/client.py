from __future__ import annotations

import base64
import io
import json
import wave

import httpx
from livekit import rtc
from livekit.agents.utils import AudioBuffer


class SarvamClient:
    STT_URL = "https://api.sarvam.ai/speech-to-text"
    TTS_URL = "https://api.sarvam.ai/text-to-speech"
    DEFAULT_SPEAKER = "priya"

    def __init__(self, api_key: str, *, tts_speaker: str = DEFAULT_SPEAKER) -> None:
        self._api_key = api_key
        self._tts_speaker = (tts_speaker or self.DEFAULT_SPEAKER).strip().lower()
        self._client = httpx.AsyncClient(timeout=120.0)

    async def transcribe_wav(self, wav: bytes, language_code: str) -> str:
        files = {"file": ("audio.wav", wav, "audio/wav")}
        data = {"model": "saaras:v3", "mode": "transcribe"}
        if language_code:
            data["language_code"] = language_code
        response = await self._client.post(
            self.STT_URL,
            headers={"api-subscription-key": self._api_key},
            data=data,
            files=files,
        )
        raw = response.text
        if response.status_code < 200 or response.status_code >= 300:
            raise RuntimeError(f"sarvam stt: HTTP {response.status_code}: {raw.strip()}")
        try:
            payload = response.json()
            return str(payload.get("transcript") or payload.get("text") or "").strip()
        except json.JSONDecodeError:
            return raw.strip()

    async def synthesize(self, text: str, language_code: str) -> bytes:
        response = await self._client.post(
            self.TTS_URL,
            headers={
                "api-subscription-key": self._api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "target_language_code": language_code,
                "model": "bulbul:v3",
                "speaker": self._tts_speaker,
                "speech_sample_rate": 24000,
            },
        )
        raw = response.content
        if response.status_code < 200 or response.status_code >= 300:
            raise RuntimeError(
                f"sarvam tts: HTTP {response.status_code}: {response.text.strip()}"
            )
        try:
            payload = response.json()
            audios = payload.get("audios") or []
            if audios:
                return _decode_maybe_base64(str(audios[0]))
        except json.JSONDecodeError:
            pass
        return raw

    async def aclose(self) -> None:
        await self._client.aclose()


def _decode_maybe_base64(value: str) -> bytes:
    if not value:
        raise RuntimeError("empty audio")
    try:
        return base64.b64decode(value)
    except Exception:
        return value.encode("utf-8")


def frames_to_wav(buffer: AudioBuffer | rtc.AudioFrame | list[rtc.AudioFrame], sample_rate: int = 16000) -> bytes:
    if isinstance(buffer, rtc.AudioFrame):
        frames = [buffer]
    elif isinstance(buffer, list):
        frames = buffer
    else:
        frames = [buffer]
    combined = rtc.combine_audio_frames(frames)
    pcm = combined.data.tobytes()
    rate = combined.sample_rate or sample_rate
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        wf.writeframes(pcm)
    return buffer.getvalue()


def wav_to_pcm(wav_bytes: bytes) -> tuple[bytes, int, int]:
    with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
        sample_rate = wf.getframerate()
        num_channels = wf.getnchannels()
        pcm = wf.readframes(wf.getnframes())
    return pcm, sample_rate, num_channels
