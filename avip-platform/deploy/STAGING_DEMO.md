# Staging — voice demo only

Deploy the **Soniqa browser demo** (`/demo`) on the existing staging EC2 for internal testers and marketing video recording. No Shopify app, no PSTN, no Temporal worker required.

**Target URL (example):** `https://3-111-61-150.sslip.io/demo`

---

## What runs

| Component | Where | Notes |
|-----------|--------|--------|
| **platform-api** (Kotlin + built React) | Docker `staging-demo.yml` → `127.0.0.1:13001` | Postgres + Flyway only |
| **Python agent** | `soniqa/agent` Docker | Same LiveKit project; replaces Go agent for demo |
| **Caddy** | Existing Go staging stack | Proxy `/demo*` → Kotlin API |
| **Go api/worker** | Unchanged | Shopify/simulation paths stay on Go |

---

## Prerequisites

- SSH access to staging EC2 (`STAGING_HOST` from GitHub secrets / `STAGING_LINKS.md`)
- DNS already points to Elastic IP (`3-111-61-150.sslip.io`)
- LiveKit, Sarvam, OpenRouter keys (same as local `.env`)
- **SMTP** for demo magic links (SES/SendGrid) — or temporarily `AVIP_VOICE_DEMO_GATE_ENABLED=false` for a trusted internal shoot only

---

## One-time setup on EC2

### 1. Clone / pull Kotlin platform + Python agent

```bash
sudo mkdir -p /opt/soniqa-demo
sudo chown "$USER" /opt/soniqa-demo
cd /opt/soniqa-demo
git clone <your-platform-repo> platform
git clone <your-agent-repo> agent
```

### 2. Platform env

```bash
cd /opt/soniqa-demo/platform
cp .env.staging-demo.example .env.staging-demo
# Edit: APP_URL, LIVEKIT_*, SARVAM_*, OPENROUTER_*, secrets, SMTP
docker compose -f deploy/compose/staging-demo.yml --env-file .env.staging-demo up -d --build
curl -sf http://127.0.0.1:13001/health
```

### 3. Python agent (demo worker)

```bash
cd /opt/soniqa-demo/agent
cp .env.example .env
# Same LIVEKIT_*, SARVAM_*, OPENROUTER_* as local; AVIP_API_URL optional for browser demo
docker compose -f deploy/compose/docker-compose.yml up -d --build
docker logs -f avip-agent-agent-1   # expect "registered worker"
```

Stop the **Go agent** container on staging if both compete for the same `LIVEKIT_AGENT_NAME`:

```bash
cd /opt/avip
docker compose -f deploy/compose/staging-ec2.yml stop agent
```

### 4. Caddy — route `/demo` to Kotlin

On the host, edit `/opt/avip/deploy/ec2/Caddyfile.ip-only` (or your active Caddyfile). Insert routes from [ec2/caddy-demo-routes.snippet](./ec2/caddy-demo-routes.snippet) **before** the catch-all `marketing:4321` handler.

Ensure Caddy can reach the host port (Docker Desktop uses `host.docker.internal`; on Linux Caddy container may need `extra_hosts: host.docker.internal:host-gateway` in `staging-ec2.yml`).

Reload:

```bash
cd /opt/avip
docker compose -f deploy/compose/staging-ec2.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## Smoke test

1. Open `https://<staging-host>/demo`
2. Request access (or use admin invite at `https://<staging-host>/admin` → Demo invites)
3. Start demo → Hindi → Availability → mic switch → confirm agent closes (not loop)
4. Stop → check `system: transcript logged`

---

## Giving links to testers

| Audience | How |
|----------|-----|
| **Internal team** | Admin → Demo invites → email magic link |
| **Marketing video** | Same; or gate off briefly on staging only (`AVIP_VOICE_DEMO_GATE_ENABLED=false`) |
| **Public internet** | Do **not** disable gate; use invites + short TTL |

---

## Updates (redeploy demo only)

```bash
cd /opt/soniqa-demo/platform && git pull
docker compose -f deploy/compose/staging-demo.yml --env-file .env.staging-demo up -d --build

cd /opt/soniqa-demo/agent && git pull
task up   # or docker compose up -d --build
```

---

## Not included (by design)

- Kotlin **platform-worker** / Temporal (not needed for `/demo`)
- MinIO recordings
- Shopify app
- Legal pages still placeholder — OK for internal staging
- CI deploy workflow — add later; manual SSH deploy is enough for first testers

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| 502 on `/demo/tts` | Sarvam credits + `SARVAM_API_KEY` in `.env.staging-demo` |
| Agent never joins | Python agent running; Go agent stopped; `LIVEKIT_AGENT_NAME` match |
| Magic link broken | `APP_URL` must exactly match browser URL (https, no trailing slash) |
| Mic blocked | Must be HTTPS (Caddy), not `http://IP:13001` |
| Re-ask loop | Redeploy latest agent (rules + LLM closing fix) |
