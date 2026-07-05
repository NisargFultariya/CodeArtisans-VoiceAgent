from __future__ import annotations

import logging

from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli

# Reuse SDK modules from avip-agent-main unchanged
from avip_agent.openrouter import OpenRouterClient
from avip_agent.sarvam import SarvamClient
from avip_agent.session.runner import (
    build_session,
    register_transcript_handler,
    start_session,
    wait_for_remote_participant,
)
from avip_agent.job_state import JobState

from clinic_inbound_agent.config import load_config
from clinic_inbound_agent.inbound_flow import run_inbound_flow, extract_caller_phone

load_dotenv()
logger = logging.getLogger("clinic-agent")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Dedup guard — same as avip-agent-main pattern
_active_rooms: set[str] = set()


async def entrypoint(ctx: JobContext) -> None:
    cfg = load_config()  # loaded here — env vars available at runtime

    room_name = ctx.room.name
    if room_name in _active_rooms:
        logger.warning(
            "[clinic] already active in room=%s — ignoring duplicate job", room_name
        )
        return

    _active_rooms.add(room_name)
    try:
        logger.info("[clinic] job assigned room=%s", room_name)

        llm = OpenRouterClient(cfg.openrouter_api_key, model=cfg.openrouter_model)
        state = JobState()

        # Connect to the room (caller is already there — inbound flow)
        await ctx.connect()

        # Wait for the SIP/PSTN caller to appear in the room (up to 30s)
        if not await wait_for_remote_participant(ctx.room, 30):
            logger.warning("[clinic] no caller joined within 30s — aborting")
            return

        # Extract caller phone from SIP participant identity/attributes
        caller_phone = extract_caller_phone(ctx.room)
        logger.info("[clinic] caller_phone=%s", caller_phone)

        # Build STT/TTS session using SDK (Sarvam)
        sarvam_client = SarvamClient(
            cfg.sarvam_api_key, tts_speaker=cfg.sarvam_tts_speaker
        )

        # Reuse avip_agent.config.Config shape for build_session
        # We pass a lightweight mock so we don't change the SDK
        class _SdkCfgProxy:
            default_language = cfg.language

        class _MetaProxy:
            language = cfg.language

        from avip_agent.session.runner import build_session as _build
        session = _build(cfg=_SdkCfgProxy(), meta=_MetaProxy(), sarvam_client=sarvam_client)
        register_transcript_handler(session, state)
        await start_session(session, ctx.room)

        try:
            await run_inbound_flow(
                room=ctx.room,
                session=session,
                state=state,
                llm=llm,
                cfg=cfg,
                caller_phone=caller_phone,
            )
        finally:
            await llm.aclose()
            await sarvam_client.aclose()

        # Disconnect to hang up the SIP call
        try:
            await ctx.room.disconnect()
        except Exception as exc:
            logger.warning("[clinic] disconnect error: %s", exc)

    finally:
        _active_rooms.discard(room_name)


def main() -> None:
    import os
    agent_name = os.getenv("LIVEKIT_AGENT_NAME", "clinic-receptionist")
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name=agent_name,
        )
    )


if __name__ == "__main__":
    main()
