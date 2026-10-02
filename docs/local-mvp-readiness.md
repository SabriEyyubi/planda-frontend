# Local MVP repair / release checklist

Target repositories: `/Users/bt/Desktop/frontend` and `/Users/bt/Desktop/backend`.
Updated 2026-09-20 17:33 UTC: selected C / Açık Katalog design is implemented. Hosting/email integration is explicitly deferred by the user. Local Docker services, seven migrations, base seed and the opt-in demo fixture ran only in the isolated test environment. No deployment, production-data mutation, commit or push was performed.

## Latest local verification (supersedes earlier blocked reports)

- Docker is healthy after the user-approved restart. PostgreSQL, Redis and MinIO are healthy in `planda-cdesign-e2e-20260920`; existing user volumes were not deleted.
- Frontend: 137 unit tests, lint, typecheck and production build PASS. Build generated 120 static pages with mock fallback disabled. An initial build failed because the shared environment set NODE_ENV=development; the corrected production-environment build passed and both receipts remain preserved.
- Backend: latest demo-source lint/build PASS; earlier 155 unit tests PASS. Real isolated integration suite: 6/6 PASS.
- Browser suite: 13/14 PASS, zero skips/retries. The analytics test assumed existing view events in an empty database. Its setup now records a real successful project view before login; its chart assertions remain unchanged. Full replay is NOT VERIFIED: the workflow controller blocked reopening the read-only task because Next regenerated tracked next-env.d.ts. No failed record was cleared and no full-suite green claim is made.
- Additional real API smoke passed: anonymous access rejected, buyer denied developer/admin access, refresh rotates tokens, logout invalidates access and refresh.
- Demo catalog: 15 published projects (six enhanced seed records plus nine new fictional projects), six cities, 12 TRY and three USD. All detail prices/available units/payment plans are coherent. Exactly one repeat produced no duplicates: 15 projects, 48 units, 15 plans; user/role/membership/saved/lead counts unchanged. Production/missing-ack/wrong-host guards reject writes.
- All five illustrative photo URLs returned HTTP 200 and loaded in the browser. Real-backend desktop1536 and mobile390 screenshots show the demo catalog without horizontal overflow; no console warnings/errors observed in the demo tab. Photos are stock illustrations, not photos of actual Turkish properties.
- Preview: http://127.0.0.1:3000/tr . Backend: loopback13001. Demo command/docs live in `/Users/bt/Desktop/backend/scripts/demo-catalog.ts` and `/Users/bt/Desktop/backend/docs/demo-catalog.md`. The normal six-project seed is unchanged; do not run tests that assume six records against the expanded demo fixture.

Current raw evidence directory: `/private/tmp/planda-catalog-validation.Omuult`. Receipts: `compact-check-s91w9r2c` (backend integration), `compact-check-vge05tsh` (first browser run), `compact-check-zmv81ftn` (frontend unit), `compact-check-mtrdl_wb` (lint), `compact-check-tb8oklqs` (types), `compact-check-jytzjsw0` (failed development-environment build), `compact-check-5naxg011` (production build), `compact-check-y4zal6ql` (demo runtime/idempotency/guards). Screenshots: `demo-catalog-desktop.png`, `demo-catalog-mobile.png`.

Known open review items, not fixed in this narrowed test/demo request: developer leads omit contact details; several operations lists ignore pagination; admin tab requests can race; lead login continuation depends on Turkish error text; blanket409 handling can mislabel consent conflicts. Supply-editor feature breadth requires explicit scope confirmation. Production readiness remains NOT VERIFIED.

## Repairs in this delivery

- Refresh only invalidates cookies on an authoritative 401; transient/network/rate-limit errors propagate without deleting the session.
- Backend production entrypoint matches `dist/src/main.js`.
- Project updates submit the version observed by the client and reject stale writes.
- Unit summary keys include currency, and price filters/sorts require a denomination.
- Card/detail/comparison/payment displays use backend currency. Missing delivery is not labelled ready; only stock updated within 48 hours is labelled current.
- Project cards use real `heroImageUrl` with an error/missing-image fallback.
- Homepage and project listing share the flat C catalog: city sidebar, horizontal rows, mobile filter dialog, loading and empty states. Real API fields are preserved; unavailable room aggregates are not invented.
- Changing the selected city drops stale district/bounds while preserving currency and other unrelated filters; regression coverage includes selecting All and returning to the original city.
- Broker prices and lead budgets carry explicit TRY/USD denominations. City/developer summaries return no singular minimum when currencies are mixed; project broker-price fallback never crosses denominations.
- Nonmonetary filters retain both currencies. New budget/price-sort submissions require an explicit denomination.

## Required release gates

| Gate                                                                         | Current status / required action                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit/lint/typecheck/build                                                    | Final product-source snapshot: frontend137 tests plus lint/typecheck/build PASS; backend155 tests plus lint/build PASS. Independent tester ran Node22 with TLS verification enabled and frontend build mock mode disabled. OpenAPI generation was not rerun in this design-only delivery. |
| Real PostgreSQL/Redis/object-store integration and browser business journeys | Integration6/6 PASS. Browser13/14 on first run; analytics test setup repaired but full replay pending as detailed above. |
| Frontend auth-route runtime smoke                                            | Executed with mock mode off on local production Next build; login/register render, profile redirects, refresh GET returns405; desktop/mobile login has no horizontal overflow. Does not prove authenticated backend integration.                                                          |
| Hosting/domain/TLS/secrets configuration                                     | BLOCKED: target not selected                                                                                                                                                                                                                                                              |
| Trusted edge/BFF client identity for rate limiting                           | OPEN: BFF requests currently share backend socket IP. Configure and test a trusted ingress chain; do not blindly copy spoofable client headers or disable rate limits.                                                                                                                    |
| Password recovery                                                            | NOT IMPLEMENTED: current screens honestly report unavailable provider. Choose and configure recovery/email flow before claiming recovery support.                                                                                                                                         |
| Map and object-storage providers                                             | Production provider/configuration and real resource loading need validation                                                                                                                                                                                                               |
| Consent/privacy/retention                                                    | Approved lead-consent URL/version and applicable retention policy required; do not enable consent with invented text                                                                                                                                                                      |
| Backup/restore, migration/rollback, performance, monitoring                  | NOT RUN for any named production target                                                                                                                                                                                                                                                   |

Production readiness is **NOT VERIFIED**. Passing unit tests and a build are not equivalent to a live release. C layout is applied. Earlier design evidence is in [design-qa.md](../design-qa.md); its Docker/imagery limitations are superseded by the latest local verification above. Mobile filter focus/close behavior and Arabic RTL document direction were also checked against real local services before adding the nine extra demo records.

Isolated Compose configuration: `/private/tmp/planda-catalog-validation.Omuult/compose.yml` (project `planda-cdesign-e2e-20260920`, loopback ports15432/16379/19000/19001, dedicated volumes). Temporary Compose uses the official Quay MinIO image because the Docker Hub reference failed; the repository Compose image references still require correction/validation for a clean setup. Frontend dev and backend are left running for local preview. Environment setup remains in the private temporary test-environment.sh file, not committed secrets.

Independent final frontend receipts: `/var/folders/4g/lk7tbn2s0pj8zghmp7jsk9m40000gn/T/compact-check-1ldper9g` (unit), `compact-check-2oru5fhz` (lint), `compact-check-khrp_oz0` (typecheck), `compact-check-k09fkfzm` (build). Backend: `compact-check-gowwi8lz`, `compact-check-b7aampbk`, `compact-check-b_1zoosu`. Each contains output.log and summary.json. Frontend test totals include135 web +2 contract. Build regenerated the tracked Next type import to `.next/types/routes.d.ts`.

## Local verification prerequisites

Use process-local Node22 (repository manifests are authoritative), frontend pnpm9 and backend pnpm11. Do not globally change the user's toolchain. Remove any `NODE_TLS_REJECT_UNAUTHORIZED=0` override from verification subprocesses; TLS verification must remain enabled. Keep API mock fallback disabled for integration evidence.

Controller artifacts preserve legacy runs and current repair history. A failed initial frontend plan was stopped before product edits; a backend never-started superseded query plan remains pending. No controller-certified overall delivery or production completion is claimed. Independent functional and engineering validation must inspect actual final changes, not infer success from task counts.
