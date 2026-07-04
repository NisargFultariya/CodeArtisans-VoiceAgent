# AVIP migration plan

Living document for the move from legacy Go monolith + community agent SDK to **three new repos** (Option B on `laxit-patel`). Update this file when decisions change or phases complete.

**Last updated:** 2026-06-19

---

## Decisions (locked)

| Topic | Decision |
|-------|----------|
| **Deploy policy** | **Local-first** — refine on laptop; **staging deferred** until local Phase 1 checks pass |
| Legacy repos | Keep **`avip`** and **`shopify-web`** as read-only reference — do not delete |
| New repos (GitHub) | `laxit-patel/avip-platform`, `laxit-patel/avip-agent`, `laxit-patel/avip-shopify` |
| Platform language | **Kotlin** · Spring Boot 4 (modular monolith) on **JVM 25** |
| Agent language | **Python** · official [LiveKit Agents](https://github.com/livekit/agents) |
| Merchant app | **TypeScript** · React Router + Shopify CLI (port from `shopify-web`) |
| Public marketing + browser demo | **Inside `avip-platform`** — not a fourth repo |
| Orchestration | **Temporal** (Java SDK — used from Kotlin) |
| Third-party SDKs | **Adapter pattern** at module edges; Java JARs are first-class on JVM (see below) |
| Sync API | **REST + OpenAPI** between shopify ↔ platform, agent → platform |
| Primary database | **PostgreSQL** (schemas: core, compliance, audit, identity, billing) |
| Blob storage | **MinIO** (S3-compatible) for recordings, exports |
| Pub/sub | **Defer** until fan-out needed (billing, analytics); Temporal first |

---

## Repository map

### Local layout (optional checkout folder)

```text
~/Projects/vedanova/avip/     ← optional parent folder only; not a deploy unit
├── avip/                     ← LEGACY Go (reference)
├── shopify-web/              ← LEGACY TS (reference)
├── platform/                 ← avip-platform — Taskfile + Compose
├── agent/                    ← avip-agent — Taskfile + Compose
└── shopify/                  ← avip-shopify — Taskfile
```

**Local dev (production-shaped):** run each repo independently:

```bash
# terminal 1 — avip-platform
cd platform && cp .env.example .env && task up

# terminal 2 — avip-agent
cd agent && cp .env.example .env && task up

# terminal 3 — avip-shopify
cd shopify && cp .env.example .env && task dev
```

See each repo's README and `deploy/README.md` (platform).

### GitHub URLs

| Role | Repo | Replaces |
|------|------|----------|
| Kotlin/Spring backend + marketing site | `github.com/laxit-patel/avip-platform` | `avip` (api, worker, marketing, db) |
| Python voice agent | `github.com/laxit-patel/avip-agent` | `avip/cmd/agent` |
| Shopify embedded app | `github.com/laxit-patel/avip-shopify` | `shopify-web` |

---

## Stack versions (greenfield — June 2026)

### `avip-platform` (Kotlin on JVM)

| Component | Version | Notes |
|-----------|---------|-------|
| **Language** | **Kotlin** (latest stable compatible with Boot 4.1 — pin at scaffold, e.g. 2.2.x) | Source language; compiles to JVM bytecode |
| **JDK** | **25 (LTS)** | Runtime (GA 2025-09); Spring Boot 4 is **optimized for 25**. Support through ~2033. |
| **Spring Boot** | **4.1.x** (latest patch, e.g. 4.1.0+) | [System requirements](https://docs.spring.io/spring-boot/system-requirements.html). JDK 17–26 supported. |
| Spring Framework | 7.0.x (via Boot 4) | — |
| Build | **Gradle 8.14+** · **Kotlin DSL** (`build.gradle.kts`) | Preferred for Kotlin greenfield |
| Virtual threads | **On by default** (JDK 21+) | HTTP + I/O; validate Temporal activity threading before relying on VT |
| GraalVM native (optional) | GraalVM **25+** if needed later | Not day-one; EC2 runs JVM fine on t4g |
| DB migrations | Flyway | Port from goose |
| SQL access | jOOQ (preferred) or JPA | jOOQ Kotlin codegen or Java records from jOOQ |
| API docs | springdoc-openapi | Replaces Huma OpenAPI |
| Temporal | Temporal **Java** SDK | Called directly from Kotlin — no separate Temporal Kotlin SDK |
| LiveKit control plane | `io.livekit:livekit-server` | **Kotlin-native** official SDK — room create, dispatch, SIP |
| Object storage | MinIO / AWS S3 Java client | S3-compatible API via adapter |

### `avip-agent` (Python)

| Component | Version | Notes |
|-----------|---------|-------|
| **Python** | **3.12** | Stable for LiveKit Agents |
| **livekit-agents** | Latest 1.x from PyPI | Pin in `pyproject.toml` / lockfile |
| HTTP client | httpx | Signals back to platform |
| Custom plugins | Sarvam STT + TTS | Port from Go `pkg/agent/sarvam` |

### `avip-shopify` (TypeScript)

| Component | Version | Notes |
|-----------|---------|-------|
| **Node** | **≥ 20** | Match current `shopify-web` |
| Package manager | pnpm | — |
| OpenAPI client | Generated from platform `openapi.json` | Replace `../avip/docs/openapi.json` path with platform URL |

### Infrastructure (unchanged initially)

| Component | Notes |
|-----------|-------|
| Postgres | App DB + Temporal DB (separate DBs or schemas) |
| LiveKit + SIP | Existing staging setup |
| Caddy | HTTPS on EC2 |
| OpenTofu | Staging EC2; update paths `/opt/avip` → `/opt/platform` when cutover |

---

## Where does the public marketing / demo site live?

**Answer: `avip-platform` — module `marketing` (or package `web`), not a separate repo.**

Legacy Go already colocated marketing with API (`cmd/marketing`: home, install, legal, `/demo` browser voice). Same model in Kotlin/Spring:

| Surface | Owner | Tech |
|---------|-------|------|
| `/`, `/install`, legal pages | platform · marketing module | Thymeleaf **or** static HTML + Spring MVC |
| `/demo` browser voice UI | `platform-web` React app + `platform-marketing` REST (`/demo/session`, transcribe, TTS) |
| LiveKit browser session | agent (Python) | Dispatched like today for `avip-demo-*` rooms |
| Shopify embedded admin | `avip-shopify` only | — |

**Why not a fourth repo?**

- Same deploy domain, shared env, shared auth secrets for demo endpoints
- Marketing pages often call platform APIs (install OAuth links, health)
- Avoid extra CI/CD and Caddy routing until you need a separate marketing team or CDN-only site

**When to split later:** dedicated `avip-web` repo only if marketing becomes a large SPA with its own release cycle (unlikely near-term).

---

## Platform module structure (target)

```text
avip-platform/
├── platform-api/          # REST + internal routes, OpenAPI
├── platform-workflow/     # Temporal workflows + activities
├── platform-compliance/   # consent, DND, audit, merchant terms
├── platform-telephony/    # LiveKit + MSG91 adapters
├── platform-billing/      # usage meters (Stripe later)
├── platform-marketing/    # public site + /demo
├── platform-persistence/  # Flyway + jOOQ
└── platform-storage/      # MinIO client
```

Single deployable JAR (or api + worker as two processes from same repo — mirror current api/worker split).

---

## Java SDK interop & adapters

Kotlin and Java share the **same JVM**. A “Java-only SDK” is almost always a **Maven/Gradle JAR** — Kotlin uses it directly. There is rarely a separate Kotlin SDK, and you do **not** need to rewrite the platform in Java when a vendor ships Java docs only.

### Default rule

```text
Write platform code in Kotlin.
Depend on vendor JARs (Java or Kotlin).
Expose clean Kotlin interfaces from adapter modules at the edges.
```

### What “Java-only SDK” usually means

| Situation | What to do |
|-----------|------------|
| Java SDK on Maven Central | Add dependency; import and use from Kotlin |
| Docs/examples in Java only | Port call patterns to Kotlin (same API) |
| No Kotlin SDK listed | Normal — the Java JAR **is** the Kotlin SDK on JVM |
| LiveKit `livekit-server` | Kotlin-native; ideal for telephony control plane |
| Temporal Java SDK | Standard from Kotlin activities/workflows |
| Python/Go-only SDK (no JVM) | Separate service or HTTP — not a Kotlin vs Java issue |

### When Java APIs feel awkward in Kotlin

| Friction | Mitigation |
|----------|------------|
| Platform null types (`@Nullable`) | Kotlin nullable types; validate at adapter boundary |
| Verbose builders | Kotlin extension or small wrapper function |
| Checked exceptions | Catch at adapter; don’t leak into domain layer |
| Awkward generics | Thin adapter class or `@Suppress` at single call site |

### Adapter layout (telephony, billing, carriers)

```text
platform-telephony/
├── TelephonyPort.kt           # interface your workflows call
├── LiveKitTelephonyAdapter.kt # wraps io.livekit:livekit-server
└── Msg91Adapter.kt            # wraps MSG91 Java/HTTP SDK (future)
```

Domain and Temporal code depend on **`TelephonyPort`**, not vendor types.

### Escape hatches (rare)

1. **Thin Kotlin wrapper** — default (95% of integrations)
2. **Single `.java` file** in the same Gradle module — mixed sources allowed
3. **`platform-integrations-java` submodule** — only if tooling conflicts (unusual)

### True blockers (not fixed by choosing Java over Kotlin)

- SDK exists only for Android, .NET, or native without JNI
- No JVM artifact at all → separate microservice or REST integration

**Choosing Kotlin does not lock you out of Java SDKs.** Choosing Java would not unlock JVM libraries that Kotlin cannot already use.

---

## Kotlin conventions (platform)

Keep these consistent in `avip-platform` from day one:

| Topic | Convention |
|-------|------------|
| Packages | `com.vedanova.platform.<module>` (or `io.vedanova.avip.*`) |
| Domain models | `data class` for consent, calls, shop config; value classes for IDs where useful |
| Stages / states | `sealed class` or enum (`CallStage`, `NdrStage`, `EscalationReason`) |
| Null safety | No `!!`; use `requireNotNull` / early returns at boundaries |
| Spring | Constructor injection; `@Service`, `@Configuration`; avoid field injection |
| Coroutines | **Optional** — start with blocking Spring + virtual threads; add only if needed |
| Java interop | Keep vendor calls in `*Adapter` / `*Client` types; don’t scatter imports in domain |
| Tests | JUnit 5 + Kotlin test (`kotlin-test` or AssertJ) |
| API DTOs | Separate request/response types from domain models |

---

## Inter-service contracts (stable — do not break casually)

### LiveKit job metadata (platform → agent)

```json
{
  "workflowId": "string",
  "shopId": "string",
  "orderId": "string",
  "stage": "cod|ndr1|ndr2",
  "language": "hi-IN",
  "systemPrompt": "string",
  "simulationMode": false,
  "customerName": "string",
  "orderName": "string"
}
```

### Agent → platform

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/internal/signals/call-completed` | End call · signal Temporal |
| POST | `/internal/signals/escalate` | NDR-2 failed · human queue (TBD) |

Header: `x-avip-internal-secret`

### shopify → platform

Port existing `/internal/*` routes; publish OpenAPI from platform; regenerate TS client in `avip-shopify`.

---

## Product rules (from client — compliance)

| Rule | Status |
|------|--------|
| AI calls only on **NDR-1** and **NDR-2**; **NDR-3 → escalate** (no AI) | Planned |
| Checkout / cart **consent checkbox** + audit trail | Planned |
| TRAI **AI disclosure** in first ~3 seconds | Planned |
| **160-series** / India carrier (MSG91 POC) | Planned |
| DND scrub before dial | Planned |

Reference materials: `docs/` (client PDFs/images), legacy `avip/docs/compliance/` if present.

---

## Phased roadmap

Check boxes when done. **Order matters** — do not rewrite Kotlin platform before Python agent POC unless parallel teams.

### Phase 0 — Setup

- [x] Create GitHub repos: `avip-platform`, `avip-agent`, `avip-shopify`
- [x] Add README to each repo pointing here and to legacy repos
- [x] Mark legacy repos README: *Superseded by avip-* — reference only*
- [x] Clone new repos into local `platform/`, `agent/`, `shopify/` siblings

### Phase 1 — Python agent

- [x] Scaffold `avip-agent` from [outbound-caller-python](https://github.com/livekit-examples/outbound-caller-python)
- [x] Sarvam STT + TTS plugins
- [x] TRAI opening line in first utterance
- [x] Port multi-turn RTO dialogue + `call-completed` signal
- [x] Dockerfile ready (staging deploy **deferred** — see `agent/deploy/STAGING.md`)
- [x] Local orchestration: each repo has Taskfile + Compose (`task up` in platform; agent/shopify separate)
- [x] Verify **local** `simulate-rto` end-to-end (platform `task up`, agent `task up`, `AVIP_SMOKE_FULL=1 task test-integration` in agent)

### Phase 2 — Kotlin platform bootstrap

- [x] Spring Boot 4.1 + Kotlin + JDK 25 skeleton (`build.gradle.kts`)
- [x] Flyway: port `db/migrations` from legacy Go
- [x] Internal API parity (shops, calls, preferences, prompt, analytics, escalations, signals, trigger)
- [x] Temporal worker: `CallLifecycleWorkflow` port
- [x] LiveKit dispatch + SIP (`LiveKitTelephonyAdapter` → `livekit-server`)
- [x] Port `POST /dev/simulate-rto` (dev simulation trigger)
- [x] Local cutover: Docker Compose in **avip-platform** only (`task up`)
- [x] Compose orchestration in platform repo (`deploy/compose/docker-compose.yml`)
- [ ] Staging deploy cutover from Go API/worker

### Phase 3 — Compliance + NDR SOP

- [x] Postgres schema: `compliance.*`, `audit.*` (V2 migration)
- [x] Consent API (`POST/GET /internal/compliance/consent`)
- [x] Pre-dial gate in Temporal workflow (NDR-3, DND, consent)
- [ ] Cart consent in `avip-shopify` (theme embed / checkout extension)
- [ ] Stage-aware workflows: COD, NDR-1, NDR-2, escalate (workflow templates)
- [ ] NDR event ingest API (manual/simulate first; logistics webhook later)

### Phase 4 — Shopify app port

- [x] Copy `shopify-web` → `avip-shopify`; point `AVIP_API_URL` at Kotlin platform
- [x] Regenerate OpenAPI client from platform (`shopify/openapi/platform-api.json`)
- [ ] Staging deploy `/opt/avip-shopify` (or rename path)

### Phase 5 — Marketing + storage

- [x] Port `/demo` into `platform-marketing`
- [x] MinIO in local compose; recording object keys on `calls` table
- [ ] Port remaining marketing pages (install, legal, home)
- [ ] MinIO lifecycle / retention policy (TBD with legal)
- [ ] Agent uploads WAV to MinIO on PSTN calls

### Phase 6 — Billing + identity (later)

- [x] Identity schema (`identity` accounts, users, memberships, `shops.account_id`) — see `docs/IDENTITY.md`
- [x] Customer portal magic link (`/portal/login`) + minimal portal shell
- [ ] Shopify install → account linking flow
- [ ] Usage meters per shop / stage / minutes
- [ ] Shop RBAC (Team page)
- [ ] Stripe integration

### Phase 7 — Decommission legacy

- [ ] Retire Go `avip` from staging/prod
- [ ] Archive `shopify-web` (keep repo, no deploys)

---

## Persistence overview

| Store | Contents |
|-------|----------|
| **PostgreSQL** | Shops, orders, calls, NDR stage, consent, audit, users/RBAC, billing meters |
| **MinIO** | Call recordings, compliance export bundles |
| **Temporal** | Workflow state (not business source of truth for consent) |
| **shopify Prisma sqlite** | Shopify session only (stays in `avip-shopify`) |

MinIO bucket sketch:

```text
recordings/{shopId}/{callId}.wav
compliance/{shopId}/{orderId}/consent.json
audit/{shopId}/{yyyy-mm-dd}/export.zip
```

---

## Change log

| Date | Change |
|------|--------|
| 2026-06-19 | Initial plan: Option B repos, Java 21 + Spring Boot 4.0, Python agent, marketing inside platform, Temporal + REST, Postgres + MinIO |
| 2026-06-19 | Stack bump: **JDK 25 (LTS)** + **Spring Boot 4.1.x** (greenfield; Boot 4 optimized for JDK 25) |
| 2026-06-20 | Platform language: **Kotlin** on JVM 25 (not Java source). Added **Java SDK interop & adapters** + **Kotlin conventions** |
| 2026-06-19 | **Phase 0 complete:** created `avip-platform`, `avip-agent`, `avip-shopify` on GitHub; READMEs + local clones |
| 2026-06-19 | **Phase 1 scaffold:** Python agent with Sarvam plugins, TRAI disclosure, RTO dialogue, Docker |
| 2026-06-19 | **Local-first policy:** staging deferred; each repo runs via Taskfile + own Compose |

---

## Open questions

| # | Question | Owner |
|---|----------|-------|
| 1 | ~~Maven vs Gradle for platform?~~ | **Gradle Kotlin DSL** |
| 2 | Single JAR vs `api` + `worker` processes (like Go today)? | Prefer two processes, one repo |
| 3 | GitHub org `vedanova` later? | Optional migration from `laxit-patel/avip-*` |
| 4 | MSG91 vs other carrier for first POC? | MSG91 per client docs |
| 5 | Record all calls day one or opt-in? | Legal + client |

---

## Related docs

| Doc | Location |
|-----|----------|
| Client compliance images/PDF | `docs/` (parent folder) |
| Legacy tech debt | `avip/docs/TECH_DEBT.md` |
| Legacy browser demo | `avip/docs/demo.md` |
| Staging links | `avip/docs/STAGING_LINKS.md` |
