#!/usr/bin/env bash
# Start local dev: infra + rebuilt API + Vite (:5173 proxies to :3000).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f deploy/compose/docker-compose.yml"
INFRA="postgres temporal minio mailpit"
APPS="platform-api platform-worker"

if ! test -f .env; then
  echo "Missing .env — run: cp .env.example .env" >&2
  exit 1
fi

run_docker() {
  if docker info >/dev/null 2>&1; then
    docker compose -f deploy/compose/docker-compose.yml "$@"
  elif command -v sg >/dev/null 2>&1; then
    sg docker -c "docker compose -f deploy/compose/docker-compose.yml $*"
  else
    echo "Docker is not available. Add your user to the docker group or start Docker Desktop." >&2
    exit 1
  fi
}

echo "→ Starting infra ($INFRA)..."
run_docker up -d $INFRA

echo "→ Ensuring avip database exists..."
task ensure-db

echo "→ Building and starting API + worker..."
run_docker up -d --build $APPS

echo "→ Waiting for platform-api /health..."
i=0
until curl -sf http://127.0.0.1:3000/health >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 90 ]; then
    echo "timeout waiting for platform-api on :3000" >&2
    exit 1
  fi
  sleep 2
done

if curl -sf http://127.0.0.1:5173/ >/dev/null 2>&1; then
  echo "→ Vite already running at http://127.0.0.1:5173/"
else
  echo "→ Starting Vite dev server..."
  (cd platform-web && npm run dev) &
  i=0
  until curl -sf http://127.0.0.1:5173/ >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "$i" -ge 30 ]; then
      echo "timeout waiting for Vite on :5173" >&2
      exit 1
    fi
    sleep 1
  done
  echo "→ Vite ready at http://127.0.0.1:5173/"
fi

echo ""
echo "Dev stack ready:"
echo "  Marketing (Vite):  http://127.0.0.1:5173/"
echo "  API + static:      http://127.0.0.1:3000/"
echo "  Request demo:      http://127.0.0.1:5173/request-demo"
echo "  Live demo:         http://127.0.0.1:5173/demo (magic link)"
echo "  Admin:             http://127.0.0.1:5173/admin/"
echo "  Mailpit:           http://127.0.0.1:8025/"
echo "  Temporal UI:       http://127.0.0.1:8080/"
