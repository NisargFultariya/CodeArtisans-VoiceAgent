# Local Docker Compose stack

Self-contained stack for **avip-platform** only: Postgres, Temporal, MinIO, API, worker.

```bash
cp .env.example .env   # fill LiveKit, Sarvam, secrets
task up
```

Compose file: [compose/docker-compose.yml](compose/docker-compose.yml)

| URL | Service |
|-----|---------|
| http://127.0.0.1:3000/demo | Voice demo + marketing |
| http://127.0.0.1:3000/swagger-ui | OpenAPI |
| http://127.0.0.1:8080/ | Temporal UI |
| http://127.0.0.1:9001/ | MinIO console |

## Env

| Variable | Purpose |
|----------|---------|
| `LIVEKIT_API_URL` | Platform server SDK (`https://`) — rooms, dispatch, SIP |
| `LIVEKIT_URL` | Browser WebRTC (`wss://`) — `/demo` page |
| `LIVEKIT_AGENT_NAME` | Must match **avip-agent** worker registration |
| `AVIP_INTERNAL_SIGNAL_SECRET` | `/internal/*` auth — share with agent + shopify |
| `SARVAM_API_KEY` | Browser demo STT/TTS |

## Related deploys (separate repos)

| Repo | Run |
|------|-----|
| **avip-agent** | `task up` or `task dev` — points at `AVIP_API_URL` |
| **avip-shopify** | `task dev` — points at `AVIP_API_URL` |

Staging: [STAGING_CUTOVER.md](STAGING_CUTOVER.md)

**Demo-only on existing EC2 (internal testers / marketing video):** [STAGING_DEMO.md](STAGING_DEMO.md)
