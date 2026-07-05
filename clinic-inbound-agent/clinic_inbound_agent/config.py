from __future__ import annotations

import os
from dataclasses import dataclass


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


@dataclass(frozen=True)
class ClinicConfig:
    # --- LiveKit (inherited from avip_agent SDK pattern) ---
    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str
    livekit_agent_name: str

    # --- Voice AI ---
    sarvam_api_key: str
    sarvam_tts_speaker: str
    openrouter_api_key: str
    openrouter_model: str
    default_language: str

    # --- Clinic backend ---
    clinic_backend_url: str
    clinic_name: str

    # --- Payments ---
    razorpay_key_id: str
    razorpay_key_secret: str
    booking_fee_paise: int
    payments_service_url: str

    # --- Twilio SMS ---
    twilio_account_sid: str
    twilio_auth_token: str
    twilio_from_number: str

    # --- Behaviour ---
    hold_expiry_minutes: int
    language: str           # e.g. en-IN for English receptionist


def load_config() -> ClinicConfig:
    cfg = ClinicConfig(
        livekit_url=_env("LIVEKIT_URL"),
        livekit_api_key=_env("LIVEKIT_API_KEY"),
        livekit_api_secret=_env("LIVEKIT_API_SECRET"),
        livekit_agent_name=_env("LIVEKIT_AGENT_NAME", "clinic-receptionist"),
        sarvam_api_key=_env("SARVAM_API_KEY"),
        sarvam_tts_speaker=_env("SARVAM_TTS_SPEAKER", "anushka"),
        openrouter_api_key=_env("OPENROUTER_API_KEY"),
        openrouter_model=_env("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
        default_language=_env("DEFAULT_LANGUAGE", "en-IN"),
        clinic_backend_url=_env("CLINIC_BACKEND_URL", "http://localhost:8001"),
        clinic_name=_env("CLINIC_NAME", "Sunrise Clinic"),
        razorpay_key_id=_env("RAZORPAY_KEY_ID"),
        razorpay_key_secret=_env("RAZORPAY_KEY_SECRET"),
        booking_fee_paise=_int("BOOKING_FEE_PAISE", 50000),
        payments_service_url=_env("PAYMENTS_SERVICE_URL", "http://localhost:8002"),
        twilio_account_sid=_env("TWILIO_ACCOUNT_SID"),
        twilio_auth_token=_env("TWILIO_AUTH_TOKEN"),
        twilio_from_number=_env("TWILIO_FROM_NUMBER"),
        hold_expiry_minutes=_int("HOLD_EXPIRY_MINUTES", 15),
        language=_env("CLINIC_AGENT_LANGUAGE", "en-IN"),
    )

    missing = [
        name
        for name, value in (
            ("LIVEKIT_URL", cfg.livekit_url),
            ("LIVEKIT_API_KEY", cfg.livekit_api_key),
            ("LIVEKIT_API_SECRET", cfg.livekit_api_secret),
            ("SARVAM_API_KEY", cfg.sarvam_api_key),
            ("OPENROUTER_API_KEY", cfg.openrouter_api_key),
        )
        if not value
    ]
    if missing:
        raise RuntimeError(f"missing clinic agent env vars: {', '.join(missing)}")

    return cfg
