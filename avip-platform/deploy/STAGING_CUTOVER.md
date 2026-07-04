# Staging cutover — three independent deploys

Each repo deploys on its own (same EC2 is fine). No monorepo compose.

## 1. avip-platform

```bash
cp .env.example .env   # production secrets
task up                # or your orchestrator (systemd, k8s, etc.)
```

Required: Postgres, Temporal, MinIO, `platform-api`, `platform-worker`.

## 2. avip-agent

```bash
cp .env.example .env
task up
```

Set `AVIP_API_URL` to the platform API (internal DNS or `http://platform-api:3000` on compose network).

## 3. avip-shopify

Deploy Node app (e.g. `/opt/avip-shopify`) with its own `.env`:

```env
AVIP_API_URL=https://api.example.com
AVIP_INTERNAL_SIGNAL_SECRET=<same as platform>
```

## Smoke

From **avip-agent** repo (platform + agent running):

```bash
AVIP_SMOKE_FULL=1 task test-integration
```

Shopify Admin → Run simulation (platform + agent required).

## Rollback

Keep previous platform/agent/shopify images tagged per release; swap compose/systemd units independently.
