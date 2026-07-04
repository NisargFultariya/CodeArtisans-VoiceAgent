# Staging deploy

See **avip-platform** [deploy/STAGING_CUTOVER.md](https://github.com/laxit-patel/avip-platform/blob/main/deploy/STAGING_CUTOVER.md).

Deploy this repo as a standalone Docker service on staging EC2:

```yaml
  agent:
    build:
      context: /opt/avip-agent
      dockerfile: Dockerfile
    env_file: /opt/avip-agent/.env
    environment:
      AVIP_API_URL: http://platform-api:3000
    restart: unless-stopped
```

Ensure `.env` includes `LIVEKIT_*`, `SARVAM_API_KEY`, `OPENROUTER_API_KEY`, and `AVIP_INTERNAL_SIGNAL_SECRET` matching the platform API.
