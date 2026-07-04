FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md agent.py ./
COPY avip_agent ./avip_agent

RUN pip install --no-cache-dir . \
    && python agent.py download-files

USER nobody

CMD ["python", "agent.py", "start"]
