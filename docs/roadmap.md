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

- Phase 3 — enrichment pipeline (DMI weather for catch date + spot lat/lng)
- Phase 4 — map-based catch visualization
- Phase 5 — auth + RLS
- Phase 6 — analytics dashboards + AI assistance over your own log

## Phase 3 — enrichment pipeline (next)

- Add `enrichment_status` column on `catches` (`pending | enriched | failed`)
- New `/api/enrich-catch` route that takes a `catchId`, looks up the spot's
  lat/lng, queries DMI for weather at the catch's date, patches the row
- Fire from the client immediately after insert (fire-and-forget) and on
  any page load that finds `pending` rows older than N minutes
- Per-source columns: `weather_temp_c`, `weather_wind_dir`, `weather_wind_ms`,
  `weather_source`, `weather_fetched_at`
- UI: small enrichment pill on `CatchCard`

## Phase 4 — maps

- Geocode spots that lack lat/lng (manual entry first, then a lookup service)
- Leaflet or MapLibre map view rendering `spots` with catch markers
- Filter by date range / bait / undersized

## Phase 5 — auth + RLS

- Supabase Auth (email + Google)
- Populate `owner_user_id` on `spots` and `catches`
- RLS policies (owner-only read/write)
- Auth-protect `/api/parse-catch` and `/api/enrich-catch`

## Phase 6 — analytics + AI assistance

- Dashboards reading from `spots` + enriched `catches`
- Catch counts, undersized ratios, spot popularity, bait success by conditions
- "Ask your log" — RAG over your own catches using the entity tables

## Cross-cutting

- Re-tackle the `app/page.tsx` split (Phase 1) when complexity demands
- Bait registry (mirror of spots) for Phase 6 analytics quality
- Image upload for catches
- Mobile shell
