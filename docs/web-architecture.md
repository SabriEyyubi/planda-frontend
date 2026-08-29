# PLANDA web architecture

## Architecture

The repository is a pnpm workspace with a Next.js App Router application and a
separate API contract package. The web client is feature-first, server-first,
component-based and API-contract-first. Pages and layouts default to React
Server Components; forms, interactive server state and future map behavior use
small client boundaries.

Component hierarchy:

```text
Page -> layout/section -> feature component -> UI primitive -> semantic token
```

Backend domain logic and database access are prohibited in the web app.

## Routes and layouts

`[locale]` owns language and text direction. Route groups establish public,
auth, buyer, developer, broker and admin boundaries. Public SEO surfaces use
the public layout. Account and operations surfaces use dashboard shells and
must resolve authentication server-side.

Implemented public URLs include `/`, `/projects`, `/projects/[slug]`, `/map`,
`/cities`, `/cities/[city]`, `/developers`, `/developers/[slug]`, and `/compare`.
Auth URLs include `/login`, `/register`, `/forgot-password`, and
`/reset-password`. Protected foundations include `/profile`, `/saved`,
`/alerts`, `/developer/*`, `/broker/*`, and `/admin`.

## Authentication and session

The backend will return bearer access and rotating refresh tokens. The Next.js
server boundary stores both as HttpOnly cookies; browser JavaScript cannot read
them. Production uses Secure `__Host-` cookies; development uses non-prefixed
cookies so the browser does not reject an invalid prefix/attribute combination.
Cookies are SameSite=Lax and scoped to `/`. Tokens are never written to
localStorage or sessionStorage.

The intended flow is login/register -> secure cookie write -> backend `/me` ->
session identity -> centralized permission helpers. Refresh and logout handlers
will be added only when OpenAPI supplies real operations. Return URLs must pass
the internal-path validator to prevent open redirects.
Mutating BFF handlers must additionally use the same-origin CSRF guard before
performing a backend operation.

## Authorization

Platform roles and organization membership roles are separate types.
Centralized helpers express developer, broker and admin access. Frontend checks
improve UX; backend checks remain authoritative. Until `/me` exists, protected
layouts can establish authentication boundaries but cannot truthfully enforce
role membership.

A cookie alone is classified as unverified, not authenticated. Protected pages
accept only an identity returned by the session verifier, centralize area
permissions, render forbidden separately, and preserve their exact validated
return path. The pending verifier deliberately rejects access until generated
backend operations are integrated.

## API and data

The contract flow is backend OpenAPI -> generated TypeScript schema/client ->
feature adapter -> component. The API base URL is server-only. Server-rendered
public data should call the backend directly. TanStack Query is reserved for
interactive client server-state. Search/filter state belongs in typed URL
parsers. Public data may use explicit revalidation; identity-specific data must
never enter shared caches.

The generic server transport accepts relative API paths only, defaults to
`no-store`, supports bearer attachment and timeouts, and normalizes unsuccessful
HTTP responses. Feature adapters remain the public data-access boundary.

Money values will follow the backend's decimal-string or minor-unit contract;
lossy floating-point conversion is not allowed.

## UI

Semantic CSS tokens define color, spacing, radius and shadow meaning. UI
primitives are generic and accessible; project, payment, inventory and other
domain components stay feature-owned. The foundation is mobile-first, supports
RTL, targets WCAG AA and keeps map/admin dependencies out of public bundles.

## Workflow

```text
architecture first -> components second -> approved screens third
```

For each screen: inspect the approved design, identify reusable primitives and
feature components, map API requirements, compose the page, then perform
responsive, accessibility, test and visual-review passes.

## Deferred decisions

- Replace pending auth/profile adapters after backend OpenAPI delivery.
- Implement token exchange, refresh, logout and `/me` using generated types;
  wire them to the existing cookie store, CSRF guard and session adapter.
- Enforce platform roles after session identity is available.
- Replace structural copy with fully localized approved product content.
- Add contract-backed loading, error, empty and mutation states per feature.
- Expand SEO metadata, canonical URLs, sitemap and structured data using the
  production public origin.

## Verification

GitHub Actions uses Node 22 and pnpm 9 with a frozen lockfile. It checks format,
lint, types, unit tests, production build and Chromium smoke tests. Dependency
updates are grouped weekly. Protected layouts are `noindex`; robots covers all
four locales and sitemap URLs derive from `PUBLIC_APP_URL`.
