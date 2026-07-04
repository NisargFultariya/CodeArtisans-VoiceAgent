#!/usr/bin/env bash
# Run on staging EC2 (as ec2-user). Requires /opt/avip Go stack + caddy.env.
set -euo pipefail

BRANCH="${1:-main}"
DEMO_ROOT="${DEMO_ROOT:-${HOME}/soniqa-demo}"
PLATFORM="$DEMO_ROOT/platform"
AGENT="$DEMO_ROOT/agent"
AVIP_ROOT="${AVIP_ROOT:-/opt/avip}"
PLATFORM_REPO="${PLATFORM_REPO:-}"
AGENT_REPO="${AGENT_REPO:-}"
CADDYFILE="${CADDYFILE:-$AVIP_ROOT/deploy/ec2/Caddyfile.ip-only}"
CADDY_MARKER="soniqa-demo-staging"

log() { echo "==> $*"; }

git_remote_for() {
  local repo_name="$1"
  if [[ -d "$AVIP_ROOT/.git" ]]; then
    local origin
    origin="$(git -C "$AVIP_ROOT" remote get-url origin 2>/dev/null || true)"
    if [[ "$origin" =~ github\.com[:/]([^/]+)/avip(\.git)?$ ]]; then
      local org="${BASH_REMATCH[1]}"
      if [[ "$origin" == git@* ]]; then
        echo "git@github.com:${org}/${repo_name}.git"
        return
      fi
      echo "https://github.com/${org}/${repo_name}.git"
      return
    fi
  fi
  echo "https://github.com/laxit-patel/${repo_name}.git"
}

get_env() {
  local key="$1" file="$2"
  [[ -f "$file" ]] || return 0
  grep -E "^${key}=" "$file" 2>/dev/null | tail -1 | cut -d= -f2- | sed 's/^"//;s/"$//' || true
}

derive_livekit_api_url() {
  local wss_url="$1"
  local api_url="$2"
  if [[ -n "$api_url" ]]; then
    echo "$api_url"
    return
  fi
  case "$wss_url" in
    wss://*) echo "https://${wss_url#wss://}" ;;
    ws://*) echo "http://${wss_url#ws://}" ;;
    http://*|https://*) echo "$wss_url" ;;
    *) echo "" ;;
  esac
}

ensure_repo() {
  local dir="$1" repo="$2" branch="$3"
  if [[ ! -d "$dir/.git" ]]; then
    log "clone $repo -> $dir"
    git clone "$repo" "$dir"
  fi
  git -c safe.directory="$dir" -C "$dir" fetch origin
  git -c safe.directory="$dir" -C "$dir" checkout "$branch"
  git -c safe.directory="$dir" -C "$dir" reset --hard "origin/$branch"
}

ensure_swap() {
  if ! swapon --show 2>/dev/null | grep -q /swapfile; then
    if [[ -x "$AVIP_ROOT/deploy/staging/setup-swap.sh" ]]; then
      sudo bash "$AVIP_ROOT/deploy/staging/setup-swap.sh"
    fi
  fi
}

write_platform_env() {
  local avip_env="$AVIP_ROOT/.env.staging"
  local out="$PLATFORM/.env.staging-demo"
  local caddy_env="$AVIP_ROOT/deploy/ec2/caddy.env"
  local public_host
  public_host="$(get_env STAGING_PUBLIC_HOST "$caddy_env")"
  if [[ -z "$public_host" ]]; then
    public_host="3-111-61-150.sslip.io"
  fi
  local app_url="https://${public_host}"

  local pg_pass
  pg_pass="$(get_env POSTGRES_PASSWORD "$out")"
  if [[ -z "$pg_pass" ]]; then
    pg_pass="$(get_env POSTGRES_PASSWORD "$avip_env")"
  fi
  if [[ -z "$pg_pass" ]]; then
    pg_pass="$(openssl rand -hex 12)"
  fi

  local internal_secret openrouter smtp_host mail_enabled gate_enabled
  internal_secret="$(get_env AVIP_INTERNAL_SIGNAL_SECRET "$avip_env")"
  openrouter="$(get_env OPENROUTER_API_KEY "$avip_env")"
  if [[ -z "$openrouter" && -f "$AGENT/.env" ]]; then
    openrouter="$(get_env OPENROUTER_API_KEY "$AGENT/.env")"
  fi
  smtp_host="$(get_env SMTP_HOST "$avip_env")"
  if [[ -n "$smtp_host" && "$smtp_host" != "localhost" && "$smtp_host" != "mailpit" ]]; then
    mail_enabled=true
    gate_enabled=true
  else
    mail_enabled=false
    gate_enabled=false
    log "SMTP not configured on staging — demo gate disabled (open /demo without invite)"
  fi

  local lk_url lk_api_url lk_key lk_secret lk_agent
  lk_url="$(get_env LIVEKIT_URL "$avip_env")"
  lk_api_url="$(derive_livekit_api_url "$lk_url" "$(get_env LIVEKIT_API_URL "$avip_env")")"
  lk_key="$(get_env LIVEKIT_API_KEY "$avip_env")"
  lk_secret="$(get_env LIVEKIT_API_SECRET "$avip_env")"
  lk_agent="$(get_env LIVEKIT_AGENT_NAME "$avip_env")"

  cat >"$out" <<EOF
APP_URL=${app_url}
POSTGRES_PASSWORD=${pg_pass}
LIVEKIT_URL=${lk_url}
LIVEKIT_API_URL=${lk_api_url}
LIVEKIT_API_KEY=${lk_key}
LIVEKIT_API_SECRET=${lk_secret}
LIVEKIT_AGENT_NAME=${lk_agent}
SARVAM_API_KEY=$(get_env SARVAM_API_KEY "$avip_env")
SARVAM_TTS_SPEAKER=$(get_env SARVAM_TTS_SPEAKER "$avip_env")
OPENROUTER_API_KEY=${openrouter}
AVIP_INTERNAL_SIGNAL_SECRET=${internal_secret}
AVIP_ADMIN_SESSION_SECRET=${internal_secret}
AVIP_VOICE_DEMO_TOKEN_SECRET=${internal_secret}
AVIP_ADMIN_USERNAME=admin
AVIP_ADMIN_PASSWORD=$(get_env AVIP_ADMIN_PASSWORD "$avip_env")
AVIP_VOICE_DEMO_GATE_ENABLED=${gate_enabled}
AVIP_MAIL_ENABLED=${mail_enabled}
AVIP_MAIL_FROM=$(get_env AVIP_MAIL_FROM "$avip_env")
SMTP_HOST=${smtp_host}
SMTP_PORT=$(get_env SMTP_PORT "$avip_env")
SIMULATION_MODE_ENABLED=false
EOF
  chmod 600 "$out"
  log "wrote $out (APP_URL=$app_url gate=$gate_enabled)"
}

write_agent_env() {
  local avip_env="$AVIP_ROOT/.env.staging"
  local out="$AGENT/.env"
  cat >"$out" <<EOF
LIVEKIT_URL=$(get_env LIVEKIT_URL "$avip_env")
LIVEKIT_API_KEY=$(get_env LIVEKIT_API_KEY "$avip_env")
LIVEKIT_API_SECRET=$(get_env LIVEKIT_API_SECRET "$avip_env")
LIVEKIT_AGENT_NAME=$(get_env LIVEKIT_AGENT_NAME "$avip_env")
SARVAM_API_KEY=$(get_env SARVAM_API_KEY "$avip_env")
SARVAM_TTS_SPEAKER=$(get_env SARVAM_TTS_SPEAKER "$avip_env")
OPENROUTER_API_KEY=$(get_env OPENROUTER_API_KEY "$avip_env")
OPENROUTER_DEMO_MODEL=openai/gpt-4o-mini
AVIP_API_URL=https://$(get_env STAGING_PUBLIC_HOST "$AVIP_ROOT/deploy/ec2/caddy.env")
AVIP_INTERNAL_SIGNAL_SECRET=$(get_env AVIP_INTERNAL_SIGNAL_SECRET "$avip_env")
DEFAULT_LANGUAGE=hi-IN
EOF
  chmod 600 "$out"
}

patch_caddy() {
  [[ -f "$CADDYFILE" ]] || { log "skip caddy — missing $CADDYFILE"; return 0; }
  if grep -q "$CADDY_MARKER" "$CADDYFILE"; then
    log "caddy already patched"
    return 0
  fi
  local tmp
  tmp="$(mktemp)"
  awk -v marker="$CADDY_MARKER" '
    /handle \{/ && !patched && prev ~ /reverse_proxy marketing:4321/ { exit }
    { print }
  ' "$CADDYFILE" >/dev/null 2>&1 || true

  python3 - "$CADDYFILE" "$tmp" "$CADDY_MARKER" <<'PY'
import sys
path, out, marker = sys.argv[1:4]
text = open(path).read()
if marker in text:
    open(out, "w").write(text)
    sys.exit(0)
block = f"""
\t# {marker}
\thandle /demo* {{
\t\treverse_proxy 172.17.0.1:13001
\t}}
\thandle /request-demo* {{
\t\treverse_proxy 172.17.0.1:13001
\t}}
\thandle /assets/* {{
\t\treverse_proxy 172.17.0.1:13001
\t}}
\thandle /admin* {{
\t\treverse_proxy 172.17.0.1:13001
\t}}
\thandle /openapi.json {{
\t\treverse_proxy 172.17.0.1:13001
\t}}
\thandle /swagger-ui* {{
\t\treverse_proxy 172.17.0.1:13001
\t}}
"""
needle = "\thandle {\n\t\treverse_proxy marketing:4321"
if needle not in text:
    raise SystemExit(f"could not find marketing catch-all in {path}")
open(out, "w").write(text.replace(needle, block + needle, 1))
PY
  cp "$tmp" "$CADDYFILE"
  rm -f "$tmp"
  log "patched $CADDYFILE"
  if [[ -f "$AVIP_ROOT/deploy/staging/compose-env.sh" ]]; then
    ROOT="$AVIP_ROOT" STAGING_IP_ONLY=1
    # shellcheck source=/dev/null
    source "$AVIP_ROOT/deploy/staging/compose-env.sh"
    "${COMPOSE[@]}" exec -T caddy caddy reload --config /etc/caddy/Caddyfile \
      || log "caddy reload failed — reload manually"
  fi
}

main() {
  [[ -d "$AVIP_ROOT" ]] || { echo "missing $AVIP_ROOT" >&2; exit 1; }
  [[ -f "$AVIP_ROOT/.env.staging" ]] || { echo "missing $AVIP_ROOT/.env.staging" >&2; exit 1; }

  ensure_swap
  mkdir -p "$DEMO_ROOT"
  PLATFORM_REPO="${PLATFORM_REPO:-$(git_remote_for avip-platform)}"
  AGENT_REPO="${AGENT_REPO:-$(git_remote_for avip-agent)}"
  log "platform repo: $PLATFORM_REPO"
  log "agent repo: $AGENT_REPO"
  ensure_repo "$PLATFORM" "$PLATFORM_REPO" "$BRANCH"
  ensure_repo "$AGENT" "$AGENT_REPO" "$BRANCH"

  write_platform_env
  write_agent_env

  log "build platform demo stack"
  docker compose -f "$PLATFORM/deploy/compose/staging-demo.yml" --env-file "$PLATFORM/.env.staging-demo" up -d --build

  log "build python agent"
  (cd "$AGENT" && docker compose -f deploy/compose/docker-compose.yml --env-file .env up -d --build)

  log "stop Go agent (python agent owns LiveKit worker name)"
  if [[ -f "$AVIP_ROOT/deploy/staging/compose-env.sh" ]]; then
    ROOT="$AVIP_ROOT" STAGING_IP_ONLY=1
    # shellcheck source=/dev/null
    source "$AVIP_ROOT/deploy/staging/compose-env.sh"
    "${COMPOSE[@]}" stop agent || true
  fi

  patch_caddy

  log "health"
  curl -sf "http://127.0.0.1:13001/health"
  public_host="$(get_env STAGING_PUBLIC_HOST "$AVIP_ROOT/deploy/ec2/caddy.env")"
  curl -sfI "https://${public_host}/demo" | head -1 || log "HTTPS /demo check failed — verify Caddy"
  log "done — https://${public_host}/demo"
}

main "$@"
