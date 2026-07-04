---
name: avip-compliance
description: AVIP TRAI compliance, NDR staging, consent audit, and dial gating. Use when editing compliance tables, NdrStage, ComplianceService, audit events, or call eligibility before AI dial.
paths: platform/platform-workflow/src/main/kotlin/com/vedanova/platform/compliance/**,platform/platform-api/src/main/resources/db/migration/V2__*.sql,platform/docs/**
---

# AVIP compliance

## Locked business rules

| Rule | Implementation |
|------|----------------|
| AI only on **NDR-1** and **NDR-2** | `NdrStage.allowsAiDial()` returns false for `ndr-3` |
| NDR-3 → human escalation / RTO | No AI dial; workflow escalates |
| Consent before dial | `ComplianceService` + `order_consent` table |
| Audit trail | `audit.events` table |

## NDR stages (`NdrStage.kt`)

```kotlin
NDR1 = "ndr-1"   // first failed delivery — AI allowed
NDR2 = "ndr-2"   // second attempt — AI allowed
NDR3 = "ndr-3"   // third+ — AI NOT allowed
```

`fromAttemptNumber(attemptNumber)` maps Shopify fulfillment attempt → stage.

## Key types

- `ComplianceService` — `checkDialCompliance(DialComplianceInput)` before PSTN dial
- `ComplianceRepository` / `ComplianceRepositories.kt` — consent reads/writes
- `CallLifecycleWorkflowImpl` — calls compliance activity before dial

## DB (Flyway)

- `V2__compliance_audit_recordings.sql` — `compliance.order_consent`, `audit.events`, recording metadata on calls

## TRAI / product (design reference)

- Checkout consent checkbox (Shopify Liquid) — merchant-facing, not in platform yet
- AI disclosure on call start — agent `runner.py` / dialogue
- DND scrubbing — deferred; design carrier adapter separately

## When changing compliance

1. Update `ComplianceService` + tests (`ComplianceServiceTest`)
2. Add Flyway migration if schema changes
3. Ensure workflow still gates dial **before** LiveKit PSTN
4. Log audit events for denied dials (reason code)

Do not bypass compliance in demo path without explicit `demo=true` metadata on agent jobs.
