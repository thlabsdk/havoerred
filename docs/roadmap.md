# Roadmap

## Completed milestones

- Next.js 16 application scaffolded
- Supabase client integrated
- `catches` table created and mapped to frontend models
- JSON import/export pipeline implemented
- Basic catch CRUD workflows available
- OpenAI parse route and AI parsing flow added
- **Phase 0 — foundations**:
  - `.env.example` documented
  - Vitest set up with mapper + schema coverage
  - AI route hardened: `response_format: json_object`, deterministic
    `undersized`, `lengthCm` coercion, date format validation, prompt/schema
    null-vs-empty contract reconciled, model configurable via
    `OPENAI_PARSE_MODEL`, verbose logs gated behind `DEBUG_AI_PARSE`,
    dropped the `as any` cast
- **Phase 2 — spot registry**:
  - `spots` table with canonical name + aliases + body of water + lat/lng + owner
  - `catches.spot_id` FK
  - `SpotPicker` UI + create-from-text flow
  - AI prompt now receives the user's spots and resolves matches to `spotId`
  - Defensive id validation against hallucinated ids
  - Test coverage for spot mappers + spotId behavior in catch schema/mappers
- **Phase 3 — enrichment pipeline**:
  - Weather enrichment via Open-Meteo (archive + forecast endpoints based on
    catch date), populating `wind_speed_ms`, `air_temperature_c`,
    `weather_code`, `weather_source`, `weather_fetched_at`
  - Water enrichment via Open-Meteo Marine (sea-level MSL) deriving
    `water_level_trend` and `tide_phase` heuristically
  - Async orchestration: both providers run in parallel, each returns a
    `ProviderOutcome<T>` so one failure can't take down the other
  - Partial success persistence: `enriched` if either source succeeds,
    `failed` only when both fail; errors concatenated into `enrichment_error`
  - Fault injection via `TEST_WEATHER_FAIL` / `TEST_WATER_FAIL` env vars for
    exercising partial-success and failure paths
  - Idempotency: already-`enriched` rows short-circuit before any external IO
  - `/api/enrich-catch` route fired from the client after insert

## Skipped/deferred

- **Phase 1 — page split**: largely addressed by the UI architecture refactor
  (see below). `app/page.tsx` is now a slim coordinator owning persisted state
  and CRUD callbacks only; modals and form state moved into per-tab views.

## UI architecture refactor (done)

Concern separation by domain, no heavy admin framework, no new routing:

- Three tabs: **Fangster** (single-catch), **Bulk** (catch import/export),
  **Steder** (spot CRUD + import/export).
- `app/page.tsx` is a coordinator (~220 lines) — state, callbacks, view
  dispatch. No form state, no modal state.
- View components: `CatchesView`, `BulkOpsView`, `SpotsView`.
- Spot management: list, inline create form, edit modal, delete confirm,
  JSON paste import, JSON export.
- Aliases are first-class in the spot form (textarea, one per line), feeding
  the AI prompt's entity resolution.
- Spot import uses the same architecture as catches: typed models, Zod
  validation (`spotSchema`), mapper layer, tolerant per-row import.

## Upcoming features

- Phase 4 — queryability + analytics foundation (SQL-first)
- Phase 5 — map-based catch visualization
- Phase 6 — auth + RLS
- Future exploration — "Ask your log" / RAG over the entity tables

## Phase 4 — queryability + analytics foundation (next)

SQL-first exploration over the enriched data. No dashboards, no charting
framework — the goal is to be able to ask correlation questions and answer
them with a query.

- Analytics-oriented views in Supabase (e.g. `catches_enriched`) that join
  catches + spots and surface enrichment columns in one row
- Nullable-safe derived fields (e.g. month/season buckets, undersized flag,
  wind-direction sector, has-weather / has-water predicates) so partial
  enrichment doesn't poison aggregates
- Correlation-ready shape: one row per catch with the dimensions you'd group
  by — spot, bait, wind sector, tide phase, water trend, time of day
- Exploratory filtering from the existing UI list (date range, bait, spot,
  enrichment status) before any dedicated analytics surface
- Lightweight smoke queries committed alongside the views so the shape is
  documented and reproducible

## Phase 5 — maps

- Geocode spots that lack lat/lng (manual entry first, then a lookup service)
- Leaflet or MapLibre map view rendering `spots` with catch markers
- Filter by date range / bait / undersized

## Phase 6 — auth + RLS

Deferred while this stays a single-user/private learning project.

- Supabase Auth (email + Google)
- Populate `owner_user_id` on `spots` and `catches`
- RLS policies (owner-only read/write)
- Auth-protect `/api/parse-catch` and `/api/enrich-catch`

## Future exploration

- "Ask your log" — RAG over your own catches using the entity tables
  (spots, baits, enriched conditions). Not on the near-term roadmap; waits
  on Phase 4 giving the data a clean queryable shape first.

## Cross-cutting

- Re-tackle the `app/page.tsx` split (Phase 1) when complexity demands
- Bait registry (mirror of spots) for Phase 4 analytics quality
- Image upload for catches
- Mobile shell
