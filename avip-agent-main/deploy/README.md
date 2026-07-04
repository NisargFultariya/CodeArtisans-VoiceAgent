# avip-agent deploy

Single-service Docker Compose: LiveKit worker only.

```bash
cp ../.env.example ../.env
task up
```

Points at **avip-platform** via `AVIP_API_URL` (default `http://host.docker.internal:3000` when platform runs on the host).

No Postgres, Temporal, or MinIO in this repo.
