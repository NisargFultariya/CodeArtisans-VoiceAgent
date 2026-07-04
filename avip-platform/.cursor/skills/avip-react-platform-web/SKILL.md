---
name: avip-react-platform-web
description: AVIP platform-web React app — Vite, React Router, shadcn/ui, Aceternity marketing, admin console, voice demo UI. Use when editing platform-web components, routes, hooks, or Vite proxy config.
paths: platform/platform-web/**
---

# AVIP platform-web (React)

## Stack

- **Vite 6** + React 19 + TypeScript
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **shadcn/ui** — `components.json`, `@/components/ui/*`
- **Aceternity** — `src/components/aceternity/*` (marketing effects)
- **livekit-client** — browser voice demo

MCP: `.cursor/mcp.json` has `shadcn` MCP for adding components.

## Route map (`App.tsx`)

| Path | Layout | Purpose |
|------|--------|---------|
| `/` | MarketingLayout | Landing |
| `/request-demo` | MarketingLayout | Email gate → magic link |
| `/demo` | DemoLayout | Live voice demo (cookie protected) |
| `/admin/*` | AdminLayout | Operator console |
| `/admin/login` | — | Operator login |

Redirects: `/try-demo`, `/book-demo` → `/request-demo`

## API clients

| File | Base paths |
|------|------------|
| `lib/api.ts` | `/admin/api/*` — Bearer token from `lib/auth.ts` |
| `lib/marketing-api.ts` | `/api/marketing/*` |
| `lib/demo-api.ts` | `/demo/*` |

## Voice demo

- `hooks/useVoiceDemo.ts` — LiveKit room, PTT, Sarvam transcribe/TTS via platform
- `components/demo/DemoLivePanel.tsx` — full-screen UI + floating dock
- `components/demo/DemoAccessGuard.tsx` — cookie / `?access=` token

## Conventions

- Path alias `@/` → `src/`
- Prefer shadcn components over raw HTML for forms/tables
- Marketing pages: `src/pages/marketing/`, content in `src/content/marketing.ts`
- Admin pages: `src/pages/*`, guarded by `RequireAuth`
- **No page scroll** on demo — `h-dvh`, internal transcript scroll only

## Add shadcn component

```bash
cd platform-web
npx shadcn@latest add <component>
```

Use the **shadcn** skill (`.agents/skills/shadcn`) — reads `components.json`.

## Dev

```bash
cd platform && task web:dev   # :5173, proxies API to :3000
```

Gradle production build copies `dist/` into `platform-api` static resources.

## React rules (project)

- Functional components + hooks only
- Colocate demo logic in `hooks/`, not inline in pages
- Parse API errors via `parseDemoErrorResponse` / `ApiError` — never show raw JSON
