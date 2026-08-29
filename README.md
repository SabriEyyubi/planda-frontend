# PLANDA Web

Production-oriented foundation for PLANDA's localized marketplace and account
surfaces. This milestone intentionally contains structural placeholders rather
than final product screens.

## Requirements

- Node.js 22 LTS
- pnpm 9.x

## Commands

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm api:generate
```

`api:generate` regenerates the typed client from the approved backend OpenAPI
snapshot at `packages/api-contract/openapi/openapi.json`. Contract tests fail
when the generated schema drifts from that snapshot.

`API_BASE_URL` is server-only. `PUBLIC_APP_URL` supplies canonical sitemap URLs
and must be set to the deployed public origin outside local development.
Locally the Next.js app uses port `3000` and the API uses port `3001`; keep
`PORT`, `PUBLIC_APP_URL` and `API_BASE_URL` aligned with the env example.
`USE_MOCK_DATA=true` switches the public project adapter completely to local
fixtures for intentional offline work. Leave it `false` for backend-integrated
development; API failures are then surfaced instead of silently showing mocks.

## Workspace

- `apps/web`: Next.js App Router client, BFF/session transport boundary and UI.
- `packages/api-contract`: reproducible OpenAPI generation; generated files are
  never manually edited.

Web code is feature-first. Domain code lives in `src/features`; generic UI and
layout building blocks live in `src/components`; infrastructure concerns live
in `src/lib`. Pages compose these pieces and remain thin.

## Routing and localization

All product routes live below `/{locale}`. Supported locales are Turkish
(default), English, Arabic and Russian. Arabic sets `dir="rtl"`. Route groups
separate public, auth, buyer, developer, broker and admin layouts without
changing public URLs.

## Authentication

The browser session boundary uses HttpOnly cookies. Tokens are never stored in
browser storage. Production uses Secure `__Host-` cookies; local development
uses valid non-prefixed cookies. SameSite is Lax, and future mutating BFF
handlers must enforce the included same-origin CSRF guard.
The Next.js BFF refreshes an expired access token once with the rotating refresh
cookie and clears the browser session when rotation fails. It contains
transport/session concerns only.
Backend authorization remains authoritative.
Protected pages preserve a validated `returnTo` path and centralize buyer,
developer, broker and admin permission decisions.

## API contract

Feature adapters under `features/*/api` mark the integration boundary. The
checked backend OpenAPI snapshot generates the schema and typed `openapi-fetch`
client; Operations DTOs and route manifests are centralized in the same package.

## Design system

Semantic design tokens live in `src/styles/tokens.css`. Generic primitives live
in `src/components/ui`; domain components must stay with their feature. Final
visual design is deliberately outside this milestone.

## Testing

Vitest covers architecture-critical utilities and component behavior. The
Playwright smoke scaffold covers homepage, project listing and project detail.
It also verifies default locale, Arabic RTL and anonymous protected-route
restoration. Role-specific authenticated flows wait for backend fixtures and
the real contract. GitHub Actions runs the complete quality suite on Node 22
and pnpm 9; Dependabot groups weekly dependency updates.

See [docs/web-architecture.md](docs/web-architecture.md) for decisions and the
implementation workflow.
