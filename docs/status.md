# Current Status

*Last updated: 2026-05-18 (after Sprint 4)*

---

## Product Direction

STL is a structured field intelligence system for sea trout fishing — not a social app,
not a dashboard product, not a map-first application.

Core priorities:
- fast field capture
- low-friction mobile logging
- structured operational data
- reliable enrichment
- entity-driven metadata

The product is intentionally becoming more structured and less form-heavy over time.

---

## Deployment

- **URL**: `trout.thlabs.dk`
- **Runtime**: independent Vercel (or equivalent) deployment, separate from THLabs platform
- **Infra**: own Supabase instance, own environment variables, own deployment pipeline
- **Status**: operational

---

## Authentication

- Provider: Supabase Auth via `@supabase/ssr`
- Flow: magic-link email → `/auth/callback` route → session cookie
- Gate: `proxy.ts` (middleware-shaped) redirects unauthenticated requests to `/login`
- Custom SMTP: configured and operational

> Note: `proxy.ts` exports the middleware function and `config` matcher, but is not named
> `middleware.ts`. Verify the Next.js 16 convention for this project — the compiled
> `.next/server/middleware.js` exists, but the wiring mechanism is non-standard.

---

## Data Model

### Tables

`catches` — the core operational record.

Key columns:
| Column | Type | Notes |
|---|---|---|
| `date` | text | `DD/MM/YYYY` — transitional; planned migration to DATE type |
| `location` | text | free-form; preserved for back-compat and unstructured entry |
| `spot_id` | bigint FK → `spots` | authoritative geo entity when set |
| `fjord` | text | nullable; derived from `spots.body_of_water` when spot linked |
| `bait`, `length_cm`, `undersized` | — | core catch fields |
| `time_of_day` | text | `HH:MM`; nullable; used by enrichment pipeline |
| `enrichment_status` | text | state machine: `pending` / `enriched` / `skipped` / `failed` |
| `wind_speed_ms`, `air_temperature_c`, `weather_code` | — | weather enrichment columns |
| `water_level_trend`, `tide_phase` | — | water enrichment columns |

`spots` — canonical fishing location registry.

Key columns: `name`, `aliases`, `body_of_water`, `latitude`, `longitude`, `region`, `owner_user_id`.

`catch_analytics_view` — SQL view joining `catches` + `spots`, adding derived fields:
`catch_date` (parsed), `catch_year`, `catch_month`, `season`, `time_bucket`,
`catch_size_bucket`, `water_trend_label`, `wind_sector`.

### RLS

Not yet enabled. Tables are open at the DB layer; access is gated at the application layer
(auth middleware + Supabase anon key scoping). RLS policies should be added before
multi-user rollout.

### snake_case / camelCase

DB uses `snake_case`. Frontend uses `camelCase`. Translation via `lib/catch_mappers.ts`
and `lib/spot_mappers.ts`.

---

## Enrichment Pipeline

Triggered: async server-side POST to `/api/enrich-catch` after catch insert.

Providers (parallel, independent, fault-isolated):
- **Weather** via Open-Meteo: wind speed, air temperature, weather code
- **Water** via Open-Meteo Marine: sea-level trend, tide phase

Requires: `spot_id` set and spot has `latitude`/`longitude`.

Status semantics:
- `pending` — not yet enriched
- `enriched` — at least one provider succeeded
- `skipped` — no spot or no coordinates
- `failed` — all providers failed

Partial success: if one provider fails, the successful provider's data is still persisted
and status is `enriched`.

Idempotent: already-`enriched` catches are skipped on re-trigger.

---

## Capture Flow

Entry modes:
1. **Manual form** (Fangster tab) — fully controlled form with `SpotPicker` + optional free-text location
2. **AI parse modal** — natural language → `/api/parse-catch` → OpenAI → validated catch prefill
3. **JSON import** (Bulk tab) — file or paste, per-row tolerant validation

Tabs:
- **Fangster** — catch form, list, search, stats, AI modal
- **Bulk** — JSON import/export for catches
- **Steder** — spot CRUD, JSON import/export

SpotPicker: dropdown of existing spots + inline "create from current text" action.
Selecting a spot hides the free-text location field and clears it.
Free-form edit clears `spotId`.

Field optimizations (Sprint 4):
- Date input: auto-formats `ddmmyyyy` → `DD/MM/YYYY` on the fly
- Length input: `type="text" inputMode="numeric"` for cleaner mobile keyboard
- Fjord field: removed; derived from `spot.bodyOfWater`
- Location field: hidden when spot is selected

---

## Infrastructure

| Service | Role |
|---|---|
| Supabase | Primary DB + auth + SSR session management |
| OpenAI (gpt-4o-mini) | AI catch parsing at `/api/parse-catch` |
| Open-Meteo | Weather enrichment at `/api/enrich-catch` |
| Open-Meteo Marine | Water/tide enrichment at `/api/enrich-catch` |
| Vercel (or equiv.) | Hosting + edge runtime |

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side enrichment writes)
- `OPENAI_API_KEY`

---

## Routing & Runtime

- `app/page.tsx` — client component, full app coordinator
- `app/login/page.tsx` — SSR, redirects if already authenticated
- `app/auth/callback/route.ts` — exchanges magic-link code for session
- `app/api/parse-catch/route.ts` — server-only AI parse endpoint
- `app/api/enrich-catch/route.ts` — server-only enrichment endpoint
- `proxy.ts` — auth middleware gate (see note under Authentication)

The main page is a single client-rendered page; initial data load is parallel
(`catches` + `spots` via `Promise.allSettled`). UI render is gated by `hydrated`.

---

## Active Capabilities

- Full catch CRUD (create, read, update, delete)
- Spot registry with full CRUD, aliases, coordinates, body-of-water
- AI-assisted catch parsing from natural language
- Spot matching and hallucinated-ID defense in AI parse route
- Weather enrichment (wind speed, air temperature, weather code)
- Water enrichment (level trend, tide phase)
- JSON export and tolerant import for both catches and spots
- Magic-link authentication
- `catch_analytics_view` for SQL-based analytical queries
- `undersized` deterministically derived from `length_cm` (threshold: 40 cm)
- `fjord` derived from `spot.bodyOfWater` when spot is linked

---

## Known Gaps

- **RLS not enabled** — DB tables are unprotected at the Supabase layer; only application-level auth gate
- **`catches.date` stored as TEXT** — `DD/MM/YYYY`; `catch_analytics_view` works around this with `to_date()`; planned future migration to DATE type
- **`proxy.ts` middleware naming** — non-standard filename; verify wiring in Next.js 16
- **`database.md` stale** — auth has shipped but `database.md` still reads "populated when auth ships" for `owner_user_id` and "RLS not yet enabled"
- **Enrichment columns not in `database.md`** — `time_of_day`, `enrichment_*`, `weather_*`, `water_*` columns added via migrations but not reflected in database.md
- **`catch_analytics_view` undocumented** — exists in migrations, no mention in docs

---

## Immediate Priorities

Per roadmap: operational usage before major redesign.

- Use the app in real fishing sessions
- Identify friction from actual field use
- Validate current capture speed in practice

Next likely engineering work:
- Data access / queryability (catch table filtering, search)
- Conversational capture endpoint (ChatGPT → structured ingestion)
- RLS policies
- `catches.date` type migration

---

## Deferred Complexity

Intentionally not current scope:
- Dashboard / chart-heavy analytics
- Social features (sharing, collaboration, team accounts)
- Notifications
- Native app
- Map-first interface
- Bait registry
- Image upload / image-assisted parsing
- Admin frameworks
- "Ask your log" / RAG over history
