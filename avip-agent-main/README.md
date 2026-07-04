# avip-agent

Python LiveKit voice worker for **AVIP**. Stateless: joins LiveKit rooms, runs dialogue, signals **avip-platform** over HTTP.

![CI](https://github.com/laxit-patel/avip-agent/actions/workflows/ci.yml/badge.svg)

## Prerequisites

- [Task](https://taskfile.dev)
- Running **avip-platform** API (`AVIP_API_URL`)
- LiveKit Cloud credentials
- Sarvam + OpenRouter API keys

## Quick start

```bash
cp .env.example .env
task install
task download-files
task up          # Docker
# or
task dev         # host worker
```

## Env

| Variable | Purpose |
|----------|---------|
| `LIVEKIT_*` | Worker registration + room access |
| `AVIP_API_URL` | Platform base URL (signals only) |
| `AVIP_INTERNAL_SIGNAL_SECRET` | Must match platform |
| `SARVAM_API_KEY` / `OPENROUTER_API_KEY` | PSTN voice path |

No Postgres, Temporal, or MinIO in this repo.

## Testing

```bash
task test
AVIP_SMOKE_FULL=1 task test-integration   # platform must be up
```

## Related repos

| Repo | Role |
|------|------|
| **[avip-platform](https://github.com/laxit-patel/avip-platform)** | Backend API + Temporal + DB |
| **[avip-shopify](https://github.com/laxit-patel/avip-shopify)** | Merchant admin UI |

Staging: **[deploy/STAGING.md](deploy/STAGING.md)**
