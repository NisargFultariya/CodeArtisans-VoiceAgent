from __future__ import annotations

import base64
import io
import wave

import httpx
import pytest
import respx

from avip_agent.sarvam.client import SarvamClient, frames_to_wav, wav_to_pcm


def _make_wav_bytes(sample_rate: int = 16000, duration_ms: int = 100) -> bytes:
    num_samples = sample_rate * duration_ms // 1000
    pcm = b"\x00\x00" * num_samples
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm)
    return buf.getvalue()


@pytest.mark.unit
def test_frames_to_wav_roundtrip() -> None:
    from livekit import rtc

    samples = 1600
    frame = rtc.AudioFrame.create(16000, 1, samples)
    wav = frames_to_wav(frame)
    pcm, rate, channels = wav_to_pcm(wav)
    assert rate == 16000
    assert channels == 1
    assert len(pcm) > 0


@pytest.mark.unit
@pytest.mark.asyncio
@respx.mock
async def test_sarvam_transcribe_wav() -> None:
    client = SarvamClient("test-key")
    respx.post("https://api.sarvam.ai/speech-to-text").mock(
        return_value=httpx.Response(200, json={"transcript": "नमस्ते"})
    )
    text = await client.transcribe_wav(_make_wav_bytes(), "hi-IN")
    assert text == "नमस्ते"
    await client.aclose()


@pytest.mark.unit
@pytest.mark.asyncio
@respx.mock
async def test_sarvam_synthesize_decodes_base64() -> None:
    client = SarvamClient("test-key", tts_speaker="priya")
    wav = _make_wav_bytes(sample_rate=24000)
    encoded = base64.b64encode(wav).decode()
    route = respx.post("https://api.sarvam.ai/text-to-speech").mock(
        return_value=httpx.Response(200, json={"audios": [encoded]})
    )
    out = await client.synthesize("hello", "hi-IN")
    assert out == wav
    assert route.calls.last.request.content is not None
    assert b'"speaker": "priya"' in route.calls.last.request.content
    await client.aclose()
