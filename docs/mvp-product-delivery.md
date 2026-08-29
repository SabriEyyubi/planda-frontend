# PLANDA MVP product and delivery contract

Status: approved for development on 2026-08-27. This document is the shared
product contract for the web and product API repositories. The supplied design
HTML files and `Planda ekranlar.pdf` are visual references; this contract owns
behavior, states and MVP boundaries.

## Evidence labels

- **VERIFIED**: visible in the supplied designs or implemented architecture.
- **INFERRED**: strongly implied but not explicitly specified.
- **RECOMMENDED**: safe MVP decision accepted for this delivery.
- **DECISION_REQUIRED**: intentionally deferred; it must not silently become
  product behavior.

## Business brief

**VERIFIED** PLANDA is a Turkey-focused marketplace for developer-originated
new housing. Buyers discover current projects, prices, payment plans, delivery
dates and stock; developers maintain supply, leads, media, settings and
first-party performance analytics; brokers use a privileged commercial view
plus an agency-scoped client list; admins control publication and data quality.

**RECOMMENDED** The MVP optimizes qualified lead generation, not property
transactions. Reservation, checkout, deposits, contracts, mortgages and online
payments are excluded. Price and stock are informative snapshots and are
confirmed by the developer sales office.

Success indicators:

- project-detail-to-lead conversion;
- valid lead completion and developer first-response time;
- published projects with fresh stock and price timestamps;
- discovery-to-detail and compare-to-lead conversion;
- stale-data and publication-review queue size.

No numeric targets are invented in the MVP. Baselines are collected first.

## Personas and access

| Persona               | Goal                                 | MVP access                                                    |
| --------------------- | ------------------------------------ | ------------------------------------------------------------- |
| Anonymous buyer       | Discover and evaluate projects       | Public discovery, map, detail and local compare               |
| Registered buyer      | Continue research and contact sales  | Save projects, submit/track leads, profile                    |
| Developer owner/admin | Keep supply accurate and respond     | Projects, inventory, plans, leads, analytics, media, settings |
| Broker                | Advise clients with privileged facts | Broker terms/materials, agency clients, read-only contacts    |
| Admin/super admin     | Keep marketplace trustworthy         | Review/publish/archive projects and inspect data quality      |

Backend authorization is authoritative. Public registration creates only a
buyer. Developer, broker and admin access requires privileged provisioning.

## MVP journeys

1. Buyer opens discovery, changes filters or the map bounds, and receives a
   synchronized result list and markers.
2. Buyer opens a project, reviews developer identity, stock freshness, unit
   types, payment plans and location, then compares/saves or opens the lead form.
3. Registered buyer submits contact data and explicit sharing consent. A
   duplicate submit with the same idempotency key produces one lead.
4. Developer maintains draft project facts, units and payment plans, submits the
   project for review and works the resulting lead queue.
5. Admin reviews completeness/data freshness and publishes or archives through
   the existing deterministic project lifecycle.
6. Broker opens a published project through broker mode and sees only enabled
   broker terms and downloadable material metadata.
7. Developer reviews a 7/30-day UTC trend, manages organization sales settings,
   and uploads, orders or removes project images.
8. Broker agency members create, edit and soft-archive agency client records;
   developer sales contacts remain a read-only broker directory.

## Requirements

- **REQ-001** Public discovery supports city/district, price, room, delivery,
  down-payment, monthly-payment and map-bounds filters with stable pagination.
- **REQ-002** Map markers and result cards share selection; moving the map does
  not query until the user activates “Bu bölgede ara”.
- **REQ-003** Public project detail exposes verified developer, last price/stock
  update, available unit summaries, payment plans and lead entry.
- **REQ-004** Compare supports up to four projects and remains useful when one
  project becomes unavailable. Anonymous compare is local to the browser.
- **REQ-005** Registered buyers can save/unsave published projects.
- **REQ-006** Lead submission requires name, phone, preferred language, explicit
  data-sharing consent and idempotency; email, budget and unit preference are
  optional.
- **REQ-007** Developers manage only their organization’s projects, inventory,
  payment plans and leads. Stale writes return conflict rather than overwrite.
- **REQ-008** Brokers receive published, broker-enabled data only. Broker terms
  are never present in public DTOs or public rendering.
- **REQ-009** Admin publication follows `DRAFT -> IN_REVIEW -> PUBLISHED ->
ARCHIVED` and preserves immutable mutation audit records.
- **REQ-010** Turkish, English, Arabic and Russian routing remains valid; the MVP
  ships complete Turkish consumer copy and safe English fallback for new copy.
- **REQ-011** All interactive controls are semantic, keyboard operable, visibly
  focused and meet WCAG 2.2 AA contrast/target expectations.
- **REQ-012** Every data surface defines loading, empty, error/retry, stale and
  success feedback without relying on color alone.
- **REQ-013** A project view is counted at most once per anonymous first-party
  session, project and UTC day. PostgreSQL stores daily aggregate counters only;
  Redis holds the HMAC deduplication claim until the UTC day ends.
- **REQ-014** Developer analytics exposes organization-scoped 7/30-day views,
  current favorite snapshot, period leads, conversion, comparisons, daily trend
  and deterministic top projects.
- **REQ-015** Broker client records belong to the broker agency, require a name
  plus phone or email, and are soft archived. Broker contacts are derived from
  broker-enabled projects and are never editable from broker mode.
- **REQ-016** Developer media accepts JPEG, PNG or WebP up to 10 MiB, validates
  signature and MIME, supports IMAGE alt text/delete/exact-set reorder, and uses
  a private S3-compatible object store behind a controlled public proxy. The
  web ingress authenticates before reading multipart data and enforces a bounded
  request body for declared and chunked uploads.
- **REQ-017** Developer settings allow OWNER/ADMIN to edit organization name,
  about, sales email, sales phone and website; MEMBER is read-only and immutable
  organization identity/status fields are excluded from the write contract.

## Screen and state matrix

| Surface         | Default                    | Loading                | Empty                          | Error                    | Success/stale                    |
| --------------- | -------------------------- | ---------------------- | ------------------------------ | ------------------------ | -------------------------------- |
| Home/projects   | Curated cards and filters  | Card skeletons         | Reset filters CTA              | Retry panel              | Freshness label                  |
| Map discovery   | List + interactive map     | List skeleton/map busy | Expand bounds/reset            | Retry list; map retained | Selected marker/card             |
| Project detail  | Facts, units, plans, CTA   | Section skeletons      | Section-specific absence       | Retry page               | Stock/price timestamp            |
| Compare         | 2–4 columns                | Skeleton columns       | Add-project CTA                | Retry affected item      | Unavailable project warning      |
| Saved           | Saved cards                | Skeleton cards         | Discover projects CTA          | Retry                    | Save/unsave announcement         |
| Lead dialog     | Form                       | Submit busy            | N/A                            | Field/summary errors     | Receipt and response expectation |
| Developer       | Operational tables         | Row skeletons          | First-project/lead CTA         | Retry                    | Conflict and stale warnings      |
| Broker          | Privileged project facts   | Skeleton               | No enabled inventory/materials | Retry/forbidden          | Freshness and scope notice       |
| Analytics       | Metrics + trend + projects | Metric skeletons       | Verified no-activity state     | Retry/request ID         | UTC/current-window notice        |
| Developer media | Upload + ordered gallery   | Project/media busy     | No projects/no media           | Retry/conflict           | Upload/reorder/delete status     |
| Settings        | Organization form          | Form busy              | No eligible organization       | Retry/conflict/forbidden | Saved + immutable-field notice   |
| Broker clients  | Search/status/cards        | Private list busy      | No agency/no matching client   | Retry/conflict/forbidden | Save/archive/privacy notice      |
| Broker contacts | Read-only directory        | Private list busy      | No enabled contact             | Retry                    | Read-only privacy notice         |
| Admin           | Review queue               | Row skeletons          | Queue complete                 | Retry                    | Publication result/audit ID      |

Responsive contract: mobile uses one content column, a bottom-sheet filter and
list/map switch; tablet uses adaptive two-column sections; desktop uses split
map/results. No fixed-width content may create horizontal page scrolling.

## Domain and lifecycle

Core entities are `User`, `Organization`, `Project`, `Unit`, `PaymentPlan`,
`Lead`, `SavedProject`, `BrokerOffer`, `ProjectMaterial`, `ProjectMedia`,
`ProjectEngagementDaily`, `BrokerClient`, `MediaDeletion` and `AuditLog`.

- Project: `DRAFT -> IN_REVIEW -> PUBLISHED -> ARCHIVED`.
- Unit: `AVAILABLE <-> RESERVED -> SOLD`; reservation itself is outside MVP and
  only an authorized developer may record an externally completed status.
- Lead: `NEW -> CONTACTED -> QUALIFIED -> CLOSED`; closing records a reason.
- Broker offer: enabled/disabled; disabling immediately removes privileged
  visibility.

Money remains a decimal string with ISO 4217 currency. Coordinates are decimal
strings. Timestamps are UTC ISO 8601. Public cache responses must never contain
identity, lead or broker-only data.

## API contract

Existing `/api/v1` identity, locations and project publication contracts remain
compatible. Additive MVP operations:

- `GET /projects` — cursor plus discovery/map filters and optional bounds.
- `GET /projects/:id` — public detail, units summary and payment plans.
- `POST /projects/:id/leads` — authenticated, consented, idempotent lead.
- `GET|PUT|DELETE /me/saved-projects[/:projectId]` — buyer saved projects.
- `GET|PATCH /developer/leads[/:leadId]` — organization-scoped workflow.
- developer project inventory/payment-plan operations under `/developer`.
- `GET /broker/projects[/:id]` — broker-only terms and material metadata.
- `POST /projects/:id/views` — anonymous session/project/day deduplicated view.
- `GET /developer/organizations` and `GET /broker/organizations` — named,
  role-aware organization scopes available to the authenticated user.
- `GET /developer/analytics?range=7|30&organizationId=...` — organization
  analytics aggregate; `organizationId` is required only for multi-membership.
- `GET|PATCH /developer/settings?organizationId=...` — role-scoped organization
  settings; `organizationId` is required only for multi-membership.
- `GET|POST /developer/projects/:id/media`, media `PATCH|DELETE`, and exact-set
  `PUT .../media/reorder` — private media management.
- `GET|POST /broker/clients`, client `GET|PATCH|DELETE` — agency CRM with DELETE
  defined as soft archive. Create/list accept `organizationId` for
  multi-membership; client-specific mutations derive scope from the client.
  `GET /broker/contacts` is read-only.
- existing admin project status endpoint remains the publication command.

Error codes are stable and include request IDs. Validation is server-side even
when repeated in the client. List responses use stable cursor pagination.

## Security, privacy and policy boundaries

- Lead data is confidential and visible only to the lead owner, the receiving
  developer organization and authorized platform admins.
- Consent text/version and timestamp are stored with the lead. Marketing consent
  is not bundled with required sales-contact consent.
- Phone/email, tokens and broker terms are excluded from logs and public caches.
- View ingestion persists no IP, user agent, raw session ID or stable anonymous
  fingerprint. Redis deduplication keys are HMAC-derived and expire daily.
- Broker client PII is organization-scoped, `private, no-store`, excluded from
  telemetry and never hard-deleted by the MVP.
- Media objects remain private; the API serves only media still attached to a
  published project. Failed object deletion retains a retryable tombstone while
  public metadata remains removed; startup recovery walks the full queue with
  starvation-safe keyset batches so failed old objects do not block newer ones.
- State-changing BFF routes authenticate private callers before reading request
  bodies. Public and private JSON/multipart ingress enforces declared-length and
  streaming byte limits before parsing or forwarding.
- Production storage accepts only HTTP(S) service endpoints and requires an
  HTTPS public media base; local endpoints and development credentials fail
  startup validation.
- All tenant queries include organization scope in the database predicate.
- WhatsApp remains a clearly labeled outbound link; PLANDA does not claim that a
  lead was recorded unless the API confirms it.
- **DECISION_REQUIRED** Legal text, controller/processor roles, retention period,
  production tile provider/SLA and broker material download authorization must
  be approved before production launch. MVP code exposes configuration seams and
  does not invent those policies.
- Lead consent remains disabled unless both `NEXT_PUBLIC_LEAD_CONSENT_URL` and
  `NEXT_PUBLIC_LEAD_CONSENT_VERSION` pass public configuration validation. The
  approved legal owner supplies both values; the client does not assume text or
  version identifiers.
- **DECISION_REQUIRED** Broker-client retention/data-subject handling and the
  production S3-compatible provider/credentials must be approved before launch.
- **DECISION_REQUIRED** Publishing organization sales email/phone on the
  unauthenticated developer profile requires explicit scraping/spam-risk
  approval. Until then, those fields are intentionally absent from the public
  DTO/rendering and are available only to authenticated settings and authorized
  broker-contact flows.

## Approved delivery decisions

- **DECISION-001 (2026-08-27)** The supplied Compare + Saved design wins over
  the earlier three-project draft: compare accepts a maximum of four projects.
- **DECISION-002 (2026-08-27)** Reservation, checkout and payment remain outside
  the MVP. Payment-plan sheets are informational calculations and never report a
  reservation or payment success.
- **DECISION-003 (2026-08-27)** Provider- or policy-dependent actions remain
  disabled or read-only with an explicit explanation until their contracts are
  approved; the UI must not fabricate successful downloads, legal consent or
  proximity data.
- **DECISION-004 (2026-08-28)** Views use first-party session + project + UTC-day
  deduplication; only daily aggregates are durable.
- **DECISION-005 (2026-08-28)** Headline favorites are the current saved-project
  snapshot; daily favorite additions remain historical and conversion is null
  when the view denominator is zero.
- **DECISION-006 (2026-08-28)** Broker clients are agency-owned and soft archived;
  broker contacts are read-only developer sales contacts.
- **DECISION-007 (2026-08-28)** Project media uses an S3-compatible adapter,
  local MinIO and JPEG/PNG/WebP validation with a 10 MiB maximum.

## Acceptance criteria

- **AC-001** Given published projects, changing a filter or confirmed bounds
  updates both list and markers and preserves a shareable URL.
- **AC-002** Keyboard users can select a card/marker, open filters, close dialogs
  and submit valid forms with visible focus.
- **AC-003** Project detail renders exact decimal money, developer verification,
  availability count and update timestamps without exposing broker data.
- **AC-004** A consentless or invalid lead is rejected; repeated idempotency key
  returns the original record and does not duplicate it.
- **AC-005** A developer outside the project organization receives forbidden for
  project, inventory, payment-plan and lead mutations.
- **AC-006** A public/buyer response never includes broker price, commission or
  private material URL.
- **AC-007** Missing, loading, empty, network failure, conflict and successful
  mutation states have deterministic UI coverage.
- **AC-008** Turkish desktop/mobile and Arabic RTL smoke paths render without
  horizontal page overflow.
- **AC-009** Backend unit tests, frontend component tests, lint, typecheck and
  production builds pass; API/database e2e is reported separately when services
  are unavailable.
- **AC-010** Repeating a view with the same session/project/day records exactly
  one view; a different organization cannot read the resulting analytics.
- **AC-011** Broker client create/update/archive and contacts enforce broker
  agency scope and developer/buyer requests receive forbidden.
- **AC-012** A valid image can be uploaded, read through its public project-media
  URL, updated, reordered and deleted; unsupported or oversized content creates
  no public metadata. Reorder conflicts roll back atomically, deletion failures
  remain retryable, and unauthenticated/oversized multipart bodies are rejected
  before unbounded buffering.
- **AC-013** Settings writes are audited and versioned, MEMBER cannot write, and
  slug/verification/status/type cannot be submitted through this surface.
- **AC-014** A user with multiple eligible organizations sees an explicit scope
  selector; analytics/settings/client requests include that organization ID,
  while project/client-specific mutations derive and verify their own scope.
  Stale responses cannot write into the newly selected organization, and a user
  with no eligible organization receives an explicit empty state.

## CI integration boundary

Frontend CI runs deterministic public fixture smoke tests. Authenticated growth
E2E requires the separately deployed backend, seeded integration identities and
S3-compatible storage; it is a mandatory local/release gate (`pnpm test:e2e`)
and is intentionally not sent to an arbitrary URL from repository secrets. A
remote mandatory job may be enabled only after the two repositories share a
trusted pipeline or a fixed, security-approved staging target.

## Dependency-aware delivery graph

| Task                | Depends on            | Output/evidence                                          |
| ------------------- | --------------------- | -------------------------------------------------------- |
| T-001 Contract      | —                     | This approved REQ/AC contract                            |
| T-002 Data/API      | T-001                 | Migration, DTOs, policies, OpenAPI, unit tests           |
| T-003 Consumer UI   | T-001, T-002 contract | Home, discovery, detail, compare/save/lead states        |
| T-004 Operations UI | T-001, T-002 contract | Developer, broker and admin MVP surfaces                 |
| T-005 Integration   | T-002, T-003, T-004   | Generated API boundary and deterministic fixtures        |
| T-006 Validation    | T-005                 | Unit/component/e2e, build, a11y/responsive visual matrix |
| T-007 Review        | T-006                 | Scope/security/architecture review and final report      |

## Visual validation matrix

Validate Turkish at 390×844, 768×1024 and 1440×900; Arabic at 390×844 and
1440×900. Cover default, loading, empty, error, selected map result, open filter,
lead validation/success, analytics trend, media upload/delete, settings form,
broker client archive, read-only contacts, stale inventory and forbidden states. Exact
reference-image parity is not required where a gap state had no supplied visual;
those states must use the existing token/component language.
