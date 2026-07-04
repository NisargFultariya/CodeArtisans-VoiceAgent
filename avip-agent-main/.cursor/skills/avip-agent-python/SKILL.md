---
name: avip-agent-python
description: AVIP Python LiveKit voice agent — worker setup, Sarvam/OpenRouter dialogue, platform HTTP signals. Use when editing agent/, debugging agent crash loops, or LiveKit job handling.
paths: agent/**
---

# AVIP Python agent

## Role

Stateless LiveKit worker: joins rooms, runs RTO recovery dialogue (hi-IN default), signals platform over HTTP only — no direct DB/Temporal access.

## Quick start

```bash
cd agent
cp .env.example .env
task install
task download-files    # Silero VAD models
task dev               # python agent.py dev
```

Docker: `task up` from `agent/` (separate compose from platform).

## Required env

| Variable | Purpose |
|----------|---------|
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Worker registration |
| `LIVEKIT_AGENT_NAME` | Must match platform dispatch (`avip-recovery-agent`) |
| `SARVAM_API_KEY` | STT/TTS (PSTN path) |
| `OPENROUTER_API_KEY` | LLM dialogue |
| `AVIP_API_URL` | Platform base (`http://localhost:3000` host, `host.docker.internal:3000` in Docker) |
| `AVIP_INTERNAL_SIGNAL_SECRET` | Must match platform |

## Layout

| Path | Role |
|------|------|
| `agent.py` | CLI entry (`dev`, `download-files`) |
| `avip_agent/session/runner.py` | Room session, demo vs PSTN |
| `avip_agent/dialogue/` | Turn planner, simulation script |
| `avip_agent/metadata.py` | Job metadata (`demo`, `lang`, workflow id) |

## Demo jobs

Metadata `demo=True` → browser user, greeting in `runner.py`, no PSTN dial.

## Testing

```bash
task test
AVIP_SMOKE_FULL=1 task test-integration   # needs platform up
```

## Logs

```bash
task logs    # Docker
```

Crash loop `missing agent env: LIVEKIT_*` → fill `agent/.env` from `avip/.env` via `cd platform && task sync-secrets`.

## Platform contract

Agent calls `AVIP_API_URL/internal/*` with `x-avip-internal-secret` — see platform `InternalApiController`.
