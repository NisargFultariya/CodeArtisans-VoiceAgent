from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str
    livekit_agent_name: str
    sarvam_api_key: str
    sarvam_tts_speaker: str
    openrouter_api_key: str
    openrouter_demo_model: str
    avip_api_url: str
    avip_internal_signal_secret: str
    default_language: str


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def load_config() -> Config:
    cfg = Config(
        livekit_url=_env("LIVEKIT_URL"),
        livekit_api_key=_env("LIVEKIT_API_KEY"),
        livekit_api_secret=_env("LIVEKIT_API_SECRET"),
        livekit_agent_name=_env("LIVEKIT_AGENT_NAME", "avip-recovery-agent"),
        sarvam_api_key=_env("SARVAM_API_KEY"),
        sarvam_tts_speaker=_env("SARVAM_TTS_SPEAKER", "priya"),
        openrouter_api_key=_env("OPENROUTER_API_KEY"),
        openrouter_demo_model=_env("OPENROUTER_DEMO_MODEL") or "openai/gpt-4o-mini",
        avip_api_url=_env("AVIP_API_URL", "http://localhost:3000"),
        avip_internal_signal_secret=_env("AVIP_INTERNAL_SIGNAL_SECRET"),
        default_language=_env("DEFAULT_LANGUAGE", "hi-IN"),
    )
    missing = [
        name
        for name, value in (
            ("LIVEKIT_URL", cfg.livekit_url),
            ("LIVEKIT_API_KEY", cfg.livekit_api_key),
            ("LIVEKIT_API_SECRET", cfg.livekit_api_secret),
            ("SARVAM_API_KEY", cfg.sarvam_api_key),
            ("OPENROUTER_API_KEY", cfg.openrouter_api_key),
            ("AVIP_INTERNAL_SIGNAL_SECRET", cfg.avip_internal_signal_secret),
        )
        if not value
    ]
    if missing:
        raise RuntimeError(f"missing agent env: {', '.join(missing)}")
    return cfg
