#!/usr/bin/env bash
# Copy LiveKit/Sarvam/OpenRouter keys from ../avip/.env into platform/.env and agent/.env
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/../avip/.env"

if [[ ! -f "$SOURCE" ]]; then
  echo "Missing $SOURCE — add LiveKit credentials there first." >&2
  exit 1
fi

KEYS=(LIVEKIT_URL LIVEKIT_API_URL LIVEKIT_API_KEY LIVEKIT_API_SECRET LIVEKIT_AGENT_NAME SARVAM_API_KEY OPENROUTER_API_KEY)

python3 - "$SOURCE" "$ROOT/.env" "$ROOT/../agent/.env" "${KEYS[@]}" <<'PY'
import sys
from pathlib import Path

source = Path(sys.argv[1])
targets = [Path(p) for p in sys.argv[2:4]]
keys = set(sys.argv[4:])

values = {}
for line in source.read_text().splitlines():
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    if k in keys and v:
        values[k] = v

if not values.get("LIVEKIT_API_KEY") or not values.get("LIVEKIT_API_SECRET"):
    sys.exit("avip/.env is missing LIVEKIT_API_KEY / LIVEKIT_API_SECRET")

wss = values.get("LIVEKIT_URL", "")
if not values.get("LIVEKIT_API_URL") and wss:
    if wss.startswith("wss://"):
        values["LIVEKIT_API_URL"] = "https://" + wss[len("wss://"):]
    elif wss.startswith("ws://"):
        values["LIVEKIT_API_URL"] = "http://" + wss[len("ws://"):]

for target in targets:
    if not target.exists():
        continue
    lines = target.read_text().splitlines()
    out, seen = [], set()
    for line in lines:
        if not line or line.startswith("#") or "=" not in line:
            out.append(line)
            continue
        k, _, _ = line.partition("=")
        if k in keys and k in values:
            out.append(f"{k}={values[k]}")
            seen.add(k)
        else:
            out.append(line)
    for k, v in values.items():
        if k not in seen and not any(l.startswith(f"{k}=") for l in lines):
            out.append(f"{k}={v}")
    target.write_text("\n".join(out) + "\n")
    print(f"Synced {target}")
PY

echo "Done. Restart platform-api and start the agent worker."
