---
name: avip-spring-security
description: AVIP Spring Security patterns — admin auth, internal secret, demo tokens, future portal OTT. Use when editing SecurityConfig, AdminAuthService, auth filters, or planning operator vs customer vs demo identity.
paths: platform/platform-api/**,platform/platform-workflow/src/main/kotlin/com/vedanova/platform/demo/**
---

# AVIP Spring Security

## Current implementation (custom filters)

The platform does **not** use `spring-boot-starter-security` yet. Auth is implemented with:

- `SecurityConfig.kt` — `internalAuthFilter`, `adminAuthFilter` (`OncePerRequestFilter`)
- `AdminAuthService.kt` — HMAC token `username|expiry`, env `AVIP_ADMIN_*`
- `VoiceDemoTokenService.kt` — demo magic-link tokens (separate from future portal login)

Frontend admin: `lib/auth.ts` stores token + `expiresAt`; `RequireAuth` calls `/admin/api/auth/me` on mount.

## Identity planes (keep separate)

| Plane | Routes | Mechanism today | Target (Spring-aligned) |
|-------|--------|-----------------|------------------------|
| Operator | `/admin/api/**` | HMAC Bearer + `AdminAuthService` | Migrate to `SecurityFilterChain` + HttpOnly session |
| Customer portal | `/portal/api/**` | HttpOnly cookie + `PortalAuthService` | Migrate to `SecurityFilterChain` + `oneTimeTokenLogin()` |
| Prospect demo | `/demo/grant-access`, cookie | `VoiceDemoTokenService` | Separate chain, short TTL |
| Agent/internal | `/internal/**` | `x-avip-internal-secret` header | Keep shared-secret filter |
| Public | marketing, health | permitAll | permitAll |

Never merge admin, portal, and demo sessions.

## Current code

- `SecurityConfig.kt` — `internalAuthFilter`, `adminAuthFilter` (`OncePerRequestFilter`)
- `AdminAuthService.kt` — HMAC token `username|expiry`, env `AVIP_ADMIN_*`
- `PortalAuthService.kt` — HMAC portal session cookie (`userId|accountId|role|expiry`)
- `PortalLoginService.kt` — DB-backed magic links via `identity.login_tokens`

## Migration direction

Replace custom filters with **multiple `SecurityFilterChain` beans** (`@Order`):

1. `/internal/**` — API key
2. `/admin/api/**` — operator auth
3. `/portal/api/**` — OTT magic link (Spring Security 6.4+)
4. `/demo/**` — demo cookie/token
5. default — public

Use `@AuthenticationPrincipal AvipPrincipal` instead of `request.setAttribute("adminUsername")`.

## Env vars

```text
AVIP_ADMIN_USERNAME
AVIP_ADMIN_PASSWORD
AVIP_ADMIN_SESSION_SECRET
AVIP_ADMIN_SESSION_TTL_HOURS
AVIP_INTERNAL_SIGNAL_SECRET
AVIP_VOICE_DEMO_TOKEN_SECRET
```

## Rules

- Resolve `account_id` / `shop_id` from authenticated principal — never trust URL/body alone
- Use `@PreAuthorize` + `PermissionEvaluator` for account → shop RBAC
- Demo magic link ≠ customer account login (different TTL, audit, cookies)

## References

- [Spring OTT login](https://docs.spring.io/spring-security/reference/servlet/authentication/onetimetoken.html)
- [Resource server multi-tenancy](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/multitenancy.html)
