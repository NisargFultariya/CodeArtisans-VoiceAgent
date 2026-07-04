# avip-platform

Kotlin/Spring Boot backend for **AVIP**: REST API, Temporal workflows, marketing `/demo`, and persistence (Postgres, MinIO).

![CI](https://github.com/laxit-patel/avip-platform/actions/workflows/ci.yml/badge.svg)

## Modules

| Module | Role |
|--------|------|
| `platform-api` | REST API (`:3000`) |
| `platform-worker` | Temporal worker |
| `platform-workflow` | Workflows, activities, persistence |
| `platform-marketing` | Public site + `/demo` |

## Stack

| Component | Version |
|-----------|---------|
| Kotlin | 2.3.21 |
| JDK | **25** (Gradle toolchain via Foojay) |
| Spring Boot | **4.1.0** |
| DB | PostgreSQL + Flyway |
| Orchestration | Temporal |
| Object storage | MinIO |
| Telephony | LiveKit server SDK |

## Quick start

Requires [Task](https://taskfile.dev) (`go-task`) and Docker.

```bash
cp .env.example .env    # fill LiveKit, Sarvam, secrets
task up
```

- Demo: http://127.0.0.1:3000/demo  
- API docs: http://127.0.0.1:3000/swagger-ui  
- Temporal UI: http://127.0.0.1:8080/

See **[deploy/README.md](deploy/README.md)** for env reference.

## Host development (optional)

With Postgres/Temporal/MinIO running (`task up` or infra only):

```bash
task bootRun      # API
task workerRun    # worker
task build
task test
```

## Related repos (deploy separately)

| Repo | Role |
|------|------|
| **[avip-agent](https://github.com/laxit-patel/avip-agent)** | LiveKit voice worker → HTTP signals to this API |
| **[avip-shopify](https://github.com/laxit-patel/avip-shopify)** | Shopify admin app → `/internal/*` on this API |

## Migration plan

**[docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md)**
