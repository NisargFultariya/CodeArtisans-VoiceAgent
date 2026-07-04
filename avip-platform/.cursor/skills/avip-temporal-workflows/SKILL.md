---
name: avip-temporal-workflows
description: AVIP Temporal workflows and activities — call lifecycle, LiveKit dispatch, compliance gates. Use when editing platform-workflow, platform-worker, CallLifecycleWorkflow, or debugging non-determinism and stuck workflows.
paths: platform/platform-workflow/**,platform/platform-worker/**
---

# AVIP Temporal workflows

## Layout

| Path | Role |
|------|------|
| `platform-workflow/` | Workflow + activity interfaces/implementations, JDBC repos |
| `platform-worker/` | Worker process (`bootRun`) |
| `CallLifecycleWorkflowImpl` | Main call pipeline |

## Call lifecycle (high level)

1. Load order context (Shopify)
2. `dispatchLivekitAgent` → LiveKit room + agent
3. `recordCallStarted`
4. `checkDialCompliance` — **must pass before dial**
5. `dialCustomerPstn` / browser demo path
6. Outcome + writeback activities

## Activities (`AvipActivities` / `AvipActivitiesImpl`)

Key activities: `dispatchLivekitAgent`, `checkDialCompliance`, `recordCallStarted`, `dialCustomerPstn`, recording upload (planned).

Adapter: `LiveKitTelephonyAdapter` — uses `livekit-server` Java SDK from Kotlin.

## Local dev

```bash
# from platform/
task up          # starts temporal :7233, worker container
task workerRun   # host worker
```

Temporal UI: http://127.0.0.1:8080/

Task queue: `avip-main` (see `avip/.env` / platform env).

## Workflow rules

- Workflows must be **deterministic** — no random, no direct I/O
- All I/O in activities with retries
- Use signals/queries for external events (agent joined, call ended)
- Version workflows before changing history (`getVersion` / patching)

## Testing

- `StubAvipActivities` in workflow tests
- `./gradlew :platform-workflow:test`

## Debugging

| Issue | Check |
|-------|-------|
| Non-determinism | Workflow code changed after runs started |
| Stuck workflow | Temporal UI → pending activities, worker logs |
| Dispatch fails | LiveKit creds, agent name `avip-recovery-agent` |

Use the **Temporal** Cursor plugin `temporal-developer` skill for SDK-specific help.
