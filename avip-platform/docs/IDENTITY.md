# AVIP identity model

Living design for customer accounts, operator users, and how they relate to Shopify shop installations.

**Last updated:** 2026-06-19

---

## Core rule

**Account = billing org. Shop = Shopify installation.**

Never conflate them. One account can own many shops; billing and team RBAC roll up at the account level; usage meters attribute per shop.

---

## Identity planes (keep separate)

| Plane | Routes | Storage | Auth mechanism |
|-------|--------|---------|----------------|
| Operator | `/admin/*` | `identity.operator_users` (future) + env bootstrap today | HMAC Bearer → HttpOnly session |
| Customer portal | `/portal/*` | `identity.users`, `identity.account_memberships` | Magic link → session cookie |
| Prospect demo | `/demo/*` | Stateless HMAC (`VoiceDemoTokenService`) | Short-lived magic link cookie |
| Shopify app | Embedded in Admin | Shopify session (Prisma in `shopify/`) | Shopify OAuth |
| Internal | `/internal/**` | — | Shared secret header |

Demo auth ≠ portal auth ≠ operator auth. Different TTLs, cookies, and audit semantics.

---

## Schema (`identity`)

Implemented in Flyway `V4__identity.sql`.

```text
identity.accounts          — billing org (name, plan_tier, status, stripe_customer_id)
identity.users             — login identity (email, auth_provider, email_verified_at)
identity.account_memberships — user ↔ account with role (owner|admin|billing|member|viewer)
identity.operator_users    — Vedanova team (superadmin|support|billing_ops)
identity.login_tokens      — portal magic links + team invites (hashed, single-use)

shops.account_id           — nullable FK until shop is claimed
```

IDs are `TEXT` hex UUIDs (same convention as `shops.id`).

### Account status

| Value | Meaning |
|-------|---------|
| `trial` | Default for new accounts |
| `active` | Paying or approved |
| `past_due` | Payment failed |
| `cancelled` | Churned |

### Customer roles (account-scoped)

| Role | Billing | Invite users | All shops |
|------|---------|--------------|-----------|
| `owner` | ✅ | ✅ | ✅ |
| `admin` | view | ✅ | ✅ |
| `billing` | ✅ | ❌ | view usage |
| `member` | ❌ | ❌ | assigned shops (future) |
| `viewer` | ❌ | ❌ | read-only (future) |

Shop-scoped membership (`identity.shop_memberships`) is deferred until portal RBAC needs per-store restrictions.

---

## Onboarding paths

Both paths converge on `shops.account_id`:

### Path A — Install first

1. Merchant installs AVIP from Shopify → `shops` row created (`account_id` null).
2. Post-install redirect prompts for owner email.
3. Portal magic link creates/links `user` + `account`, sets `shops.account_id`.

### Path B — Signup first

1. Merchant requests portal access at `/portal/login`.
2. Magic link creates `user` + `account` + `owner` membership.
3. Portal shows “Connect Shopify store” install link.
4. After OAuth, `shops.account_id` is set.

`AccountProvisioningService` implements the account + owner creation and shop linking helpers.

---

## Request context (target)

Every authenticated API request resolves once at the edge:

```text
Authorization / session cookie
→ principal_type: operator | account_user | demo | internal
→ user_id (when applicable)
→ account_id (never from URL/body alone)
→ shop_id (when shop-scoped, verified via membership)
→ roles[]
```

---

## Implementation status

| Step | Status |
|------|--------|
| `V4__identity.sql` migration | ✅ |
| Kotlin models + `IdentityRepository` | ✅ |
| `shops.account_id` + `ShopRepository.linkToAccount` | ✅ |
| `AccountProvisioningService` | ✅ |
| Portal magic link (`/portal/login`) | ✅ |
| Portal shell (shops list) | ✅ minimal |
| Shopify install → account linking | 🔲 |
| Spring Security `SecurityFilterChain` migration | 🔲 |
| Operator users in DB (replace env admin) | 🔲 |
| `billing.subscriptions` + Stripe | 🔲 Phase 6 |
| Shop-scoped RBAC | 🔲 |
| Enterprise SSO (WorkOS) | 🔲 when needed |

---

## Related

- `MIGRATION_PLAN.md` — Phase 6 billing + identity
- `.cursor/skills/avip-spring-security/SKILL.md` — filter chains and OTT target
- `VoiceDemoTokenService` — prospect demo only; do not reuse for portal
