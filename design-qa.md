# C catalog integration — visual QA

Date: 2026-09-20. final result: blocked

## Findings

- [P1 / evidence gap] Actual project photography is unavailable in the fixture preview. The source is photo-led; rendered rows display the existing honest missing-image fallback. No fictional inventory or generated listing images were introduced. Obtain real service-backed media, verify loading/crop and recapture before claiming image fidelity or final visual acceptance.
- Real service journeys remain blocked by the unresponsive Docker engine. The preview used `USE_MOCK_DATA=true`; the production build used `USE_MOCK_DATA=false`, which alone does not prove runtime integration.
- Independent source review found a P2 city-change defect (stale district/bounds). Fixed and independently reviewed;9 filter tests and137 full frontend tests passed. It changes submitted data, not visual layout. No additional actionable P1/P2 visual mismatch was found in supplied desktop/mobile captures.

## Evidence and normalization

Source visual truth: `/Users/bt/.codex/generated_images/019ffb8c-131b-7231-a1f5-a4644744b800/exec-d00a4a3e-009b-45bb-a213-75f3f8a7a4d3.png`.

Implementation screenshot: `/Users/bt/.codex/visualizations/2026/08/13/019ffb8c-131b-7231-a1f5-a4644744b800/c-catalog-desktop-fixture.png`.

Mobile screenshot: `/Users/bt/.codex/visualizations/2026/08/13/019ffb8c-131b-7231-a1f5-a4644744b800/c-catalog-mobile-fixture.png`.

Source1536×1024 pixels; implementation desktop1536×1024 pixels / CSS viewport1536×1024, devicePixelRatio1. No density resampling required. Mobile CSS viewport390×844, DPR1. Browser chrome excluded. State: anonymous Turkish catalog, default filters, fixture data. Source and implementation have different project content and missing implementation photos, so exact content/imagery comparison is blocked.

Full-view evidence: source and desktop capture were opened together in one comparison input. Mobile capture was also inspected. No focused crop was required for the current composition assessment because sidebar, heading, controls and row typography are legible at full desktop resolution. Asset micro-fidelity remains unverified, not passed by this assessment.

## Required fidelity surfaces

- Fonts/typography: existing sans family retained; dark headings, lighter metadata and price hierarchy reflect the reference. Exact mock font identity is not known; pixel-identical type matching is not claimed. No observed clipped headings or unreadable wraps in captured viewports.
- Spacing/layout:284px pale sidebar, flat horizontal media/content rows, thin separators and no hero match the chosen composition. Existing navigation and full business filter set are denser than the concept by intent, preserving MVP functions. Mobile becomes one column with a filter dialog.
- Colors/tokens: white canvas, light gray filter surface, dark text and forest-green actions retain the reference direction; no decorative gradients/card stack added. Comprehensive contrast/zoom audit not performed.
- Image quality: BLOCKED as above. Real heroImageUrl is used when present, with truthful fallback on error. Placeholder appearance is not accepted as final image fidelity.
- Copy/content: real developer name replaces unavailable room aggregates; absent delivery is unspecified. TRY/USD are explicit and not converted or aggregated across currencies. Existing multilingual fallback behavior remains; full translation completion is not claimed.

## Interaction and comparison history

Initial fixture comparison found no additional actionable layout mismatch, but imagery remained blocked; no visual pass issued. Desktop and mobile document scroll widths equalled viewport widths. Mobile filter opened, close button received focus, and closing restored opener focus. Arabic route used RTL and did not overflow at390px; RTL inline currency ordering lacks saved visual evidence. Browser error/warning logs were empty at capture. Empty/loading states exist in code and unit coverage; not all runtime states were captured.

After the review-discovered data-filter repair, unit/static/build tests were rerun and independent source review accepted the fix. No post-fix image-based pass is claimed; real-image comparison remains blocked.

## Implementation checklist / open decisions

- Done: C layout on `/` and `/projects`, mobile filters, true currency semantics, loading/empty presentation, dependent geography regression fix.
- Done: frontend137 tests, lint, typecheck and production build; backend155 tests, lint and build.
- Pending: approved Docker recovery, disposable database/Redis/MinIO start, migration/seed and real API/browser journeys.
- Pending: real media capture, desktop/mobile/RTL visual recheck, broader accessibility and error-state tests.
- Pending for release: hosting/domain/trusted ingress, email recovery provider, map/storage configuration, consent policy, backup/restore and operational checks. See `docs/local-mvp-readiness.md`.

No deployment or controller-certified delivery completion is claimed. Earlier controller task failure/repair history is retained; the original C1 task remains pending after metadata preflight refusal, while the independent functional results above are actual executed checks.
