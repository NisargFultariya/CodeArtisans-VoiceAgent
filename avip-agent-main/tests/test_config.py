from __future__ import annotations

import os

import pytest

from avip_agent.config import load_config


@pytest.mark.unit
def test_load_config_missing_required(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("LIVEKIT_URL", raising=False)
    monkeypatch.delenv("LIVEKIT_API_KEY", raising=False)
    monkeypatch.delenv("LIVEKIT_API_SECRET", raising=False)
    monkeypatch.delenv("SARVAM_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.delenv("AVIP_INTERNAL_SIGNAL_SECRET", raising=False)
    with pytest.raises(RuntimeError, match="missing agent env"):
        load_config()


@pytest.mark.unit
def test_load_config_defaults(monkeypatch: pytest.MonkeyPatch) -> None:
    for key, value in {
        "LIVEKIT_URL": "wss://lk.example",
        "LIVEKIT_API_KEY": "k",
        "LIVEKIT_API_SECRET": "s",
        "SARVAM_API_KEY": "sar",
        "OPENROUTER_API_KEY": "or",
        "AVIP_INTERNAL_SIGNAL_SECRET": "sec",
    }.items():
        monkeypatch.setenv(key, value)
    monkeypatch.delenv("LIVEKIT_AGENT_NAME", raising=False)
    monkeypatch.delenv("AVIP_API_URL", raising=False)
    monkeypatch.delenv("DEFAULT_LANGUAGE", raising=False)
    cfg = load_config()
    assert cfg.livekit_agent_name == "avip-recovery-agent"
    assert cfg.avip_api_url == "http://localhost:3000"
    assert cfg.default_language == "hi-IN"
