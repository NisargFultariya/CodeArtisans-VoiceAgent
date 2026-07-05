FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Build context is the repo root (CodeArtisans-VoiceAgent/)

# 1. Install avip-agent-main SDK first (editable)
COPY avip-agent-main /avip-agent-main
RUN pip install --no-cache-dir -e /avip-agent-main

# 2. Install clinic agent dependencies
COPY clinic-inbound-agent/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy clinic agent source
COPY clinic-inbound-agent/agent.py ./
COPY clinic-inbound-agent/clinic_inbound_agent ./clinic_inbound_agent

# 4. Pre-download LiveKit model files (Silero VAD) — no env vars needed
RUN python -c "from livekit.plugins import silero; silero.VAD.load()" || true

CMD ["python", "agent.py", "start"]
