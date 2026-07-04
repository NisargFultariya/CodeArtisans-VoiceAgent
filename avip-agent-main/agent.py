from __future__ import annotations

import logging

from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli

from avip_agent.config import load_config
from avip_agent.job_state import JobState
from avip_agent.metadata import is_demo_room, parse_job_metadata
from avip_agent.openrouter import OpenRouterClient
from avip_agent.sarvam import SarvamClient
from avip_agent.session.runner import (
    build_session,
    register_data_handlers,
    register_transcript_handler,
    run_demo_flow,
    run_pstn_flow,
    run_simulation_flow,
    start_session,
)

load_dotenv()
logger = logging.getLogger("avip-agent")
logging.basicConfig(level=logging.INFO)


active_rooms: set[str] = set()


async def entrypoint(ctx: JobContext) -> None:
    cfg = load_config()
    meta = parse_job_metadata(ctx.job.metadata or "", cfg.default_language)
    demo_mode = meta.is_demo or is_demo_room(ctx.room.name)
    simulation_mode = meta.is_simulation

    room_name = ctx.room.name
    if room_name in active_rooms:
        logger.warning(
            "Agent already active in room=%s (job_id=%s) - ignoring duplicate job request",
            room_name,
            ctx.job.id,
        )
        return

    active_rooms.add(room_name)
    try:
        logger.info(
            "job assigned room=%s workflow=%s demo=%s simulation=%s lang=%s",
            room_name,
            meta.workflow_id or "(none)",
            demo_mode,
            simulation_mode,
            meta.language,
        )

        llm = OpenRouterClient(cfg.openrouter_api_key, model=cfg.openrouter_demo_model)
        state = JobState()
        register_data_handlers(ctx.room, state, demo_mode=demo_mode)

        await ctx.connect()

        if demo_mode:
            try:
                await run_demo_flow(ctx.room, meta, llm, state)
            finally:
                await llm.aclose()
            return

        if simulation_mode:
            try:
                await run_simulation_flow(ctx, cfg, meta, llm, state)
            finally:
                await llm.aclose()
            return

        sarvam_client = SarvamClient(cfg.sarvam_api_key, tts_speaker=cfg.sarvam_tts_speaker)
        session = build_session(cfg, meta, sarvam_client)
        register_transcript_handler(session, state)
        await start_session(session, ctx.room)

        try:
            await run_pstn_flow(ctx, cfg, session, state, meta, llm)
        finally:
            await llm.aclose()
            await sarvam_client.aclose()
    finally:
        active_rooms.discard(room_name)


def main() -> None:
    import sys

    agent_name = "avip-recovery-agent"
    if "download-files" not in sys.argv:
        agent_name = load_config().livekit_agent_name

    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name=agent_name,
        )
    )


if __name__ == "__main__":
    main()
