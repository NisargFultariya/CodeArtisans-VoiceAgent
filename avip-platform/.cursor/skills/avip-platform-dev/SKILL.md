---
name: avip-platform-dev
description: Runs and debugs the AVIP platform local dev stack (Docker, Taskfile, Vite, env sync). Use when working in platform/, starting servers, fixing port 3000/5173 issues, syncing LiveKit secrets, or rebuilding platform-api.
paths: platform/**
---

# AVIP platform dev

## Stack

| Service | Dev URL | Prod compose |
|---------|---------|--------------|
| Vite (platform-web) | http://127.0.0.1:5173 | bundled in platform-api jar |
| API | http://127.0.0.1:3000 (compose) | `:3000` |
| Mailpit | http://127.0.0.1:8025 | demo magic-link emails |
| Temporal UI | http://127.0.0.1:8080 | |
| Postgres | localhost:5433 | |

## Start (preferred)

From repo root:

```bash
task dev          # platform + agent (scripts/dev-all.sh)
```

From `platform/` only:

```bash
task dev          # infra + API containers + Vite :5173
task dev:backend  # rebuild API only after Kotlin changes
task web:dev      # Vite only
```

Do **not** ask the user to start servers manually — check `:3000` and `:5173` and run `task dev` in background if down.

## Secrets

LiveKit/Sarvam keys live in `../avip/.env`. Sync into platform + agent:

```bash
task sync-secrets
```

Compose loads both `platform/.env` and `../avip/.env` for `platform-api`.

## Vite proxy

`platform-web/vite.config.ts` proxies:

- `/admin/api`, `/api/marketing`, `/health`
- `/demo/grant-access`, `/demo/access-status`, `/demo/session`, `/demo/tts`, `/demo/transcribe`

React routes `/demo` and `/request-demo` are **not** proxied (handled by Vite).

## Modules

| Module | Role |
|--------|------|
| `platform-api` | REST, admin, marketing APIs, SPA forward |
| `platform-worker` | Temporal worker |
| `platform-workflow` | Workflows, activities, JDBC repos |
| `platform-marketing` | `/demo/*` voice endpoints |
| `platform-web` | React — marketing, admin, live demo |

## Docker notes

- Project name: `avip-platform`
- May need `sg docker -c "..."` on this machine; `scripts/dev.sh` handles it
- Agent runs separately from `agent/` repo (`task dev` or Docker)

## Common fixes

| Symptom | Fix |
|---------|-----|
| `/demo/session` 500 | Empty `LIVEKIT_*` in env → `task sync-secrets`, restart API |
| Agent not joining | Start `agent` worker; check `agent/.env` credentials |
| 404 on marketing API | Rebuild API image (`task dev:backend`) after Flyway migration changes |
