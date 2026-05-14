# Havørredloggen Architecture

## Overall

Havørredloggen is a Next.js 16 app for logging Danish sea trout catches with an
AI-assisted parse helper. The app is a single client-rendered page that talks to
Supabase for persistence and to one server route (`/api/parse-catch`) for AI
parsing. The AI route now also reads from the spot registry so the model can
resolve spot names instead of merely extracting them.

## Frontend structure

`app/page.tsx` is a slim coordinator: it owns the persisted state (`catches`,
`spots`), the active tab, toast state, and the data-mutation callbacks that
wrap Supabase calls. All UI lives in three view components selected by the
tab nav.

Three tabs separate UI concerns by domain:

- **Fangster** (`components/CatchesView.tsx`) — single-catch operations. Form,
  search, list, stats, AI parse modal. Form/AI/search state lives here.
- **Bulk** (`components/BulkOpsView.tsx`) — bulk operations. Catch JSON export,
  file-picker import, paste-JSON import. Designed to absorb future bulk
  actions (re-enrich, bulk delete, etc.) without touching other views.
- **Steder** (`components/SpotsView.tsx`) — spot management. List, create
  (inline form), edit (modal), delete (confirmation modal), JSON export, paste
  JSON import.

Supporting components:

- `Tabs.tsx` — 3-way tab nav.
- `CatchForm.tsx` — fully-controlled catch entry form. Renders `SpotPicker`
  above the location input.
- `CatchCard.tsx`, `StatsCards.tsx` — catch display.
- `SpotForm.tsx` — controlled spot create/edit form with aliases textarea
  (one alias per line).
- `SpotCard.tsx` — single-spot row display.
- `SpotPicker.tsx` — dropdown of existing spots + "create from current text"
  inline button, used inside `CatchForm`.

UI render is gated by `hydrated` to avoid hydration mismatches. Initial load
fetches `catches` and `spots` in parallel via `Promise.allSettled`.

State flow: persisted lists live in `app/page.tsx`. Each view receives only
the slice + callbacks it needs (props, not context). Local UI state (form
fields, modals, search input) lives in the view that owns the UI element.
This keeps the coordinator small and the views independently editable.

## Supabase integration

- `lib/supabase.ts` creates a shared client from `NEXT_PUBLIC_SUPABASE_URL`
  and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- The frontend uses Supabase for catches CRUD and spot creation/listing.
- The AI parse route imports the same client server-side to fetch spots.
- DB ↔ frontend mapping is centralized in `lib/catch_mappers.ts` and
  `lib/spot_mappers.ts`.

## Spot registry

- The `spots` table is the canonical record for fishing locations.
- Each catch may have a `spot_id` FK to a row in `spots`. The free-form
  `catches.location` text is preserved for back-compat and quick entry, but
  `spot_id` is the source of truth when set.
- `lib/spots_repo.ts` exposes `fetchSpots`, `createSpot`, `updateSpot`,
  `deleteSpot`.
- `lib/spot-schema.ts` defines `spotSchema` used by the spot JSON import for
  tolerant validation (defaults missing fields rather than rejecting whole
  rows).
- The Steder tab provides full CRUD + JSON import/export. Deleting a spot
  uses `on delete set null` on `catches.spot_id` — existing catches keep
  their free-text location.
- `SpotPicker` inside `CatchForm` is a dropdown + "create from current text"
  control. Editing the location free-text clears `spotId` so the two stay
  consistent.

## API route architecture

- `app/api/parse-catch/route.ts` exposes a POST route for AI catch parsing.
- It is a server-only endpoint that:
  - validates incoming request payloads
  - fetches the user's spots via `fetchSpots()` and injects their canonical
    names + aliases into the system prompt
  - calls the OpenAI SDK with `response_format: { type: 'json_object' }`
  - parses the AI response
  - validates the parsed object against `catchSchema`
  - re-derives `undersized` deterministically from `lengthCm` (sea trout
    legal min 40 cm)
  - defensively nulls out any `spotId` the model returns that does not match
    a real spot
  - returns structured JSON or a detailed error
- Model and verbose logging are configurable via env: `OPENAI_PARSE_MODEL`,
  `DEBUG_AI_PARSE`.

## Zod validation flow

- `lib/catch-schema.ts` defines `catchSchema` shared by the AI route and the
  JSON import.
- `lib/coerce.ts` provides `optionalDateString` (empty or `dd/mm/yyyy`) and
  `coerceLengthCm` (strips unit text, handles `null` / `""`).
- `spotId` is optional in the schema (defaults to `null`) so legacy JSON exports
  without spots still validate.
- Validation failures return a structured error object with `details`.

## Import/export pipeline

The catch and spot import/export flows share an architecture:

- **Typed models** (`types/catch.ts`, `types/spot.ts`).
- **Zod validation** at the import boundary (`catchSchema`, `spotSchema`).
  Both schemas are tolerant — unknown rows in legacy JSON exports still
  validate as long as required fields are present.
- **Mapper layer** translates between camelCase frontend and snake_case DB.
- **Tolerant import**: each row is validated independently; invalid rows are
  logged and skipped, valid rows are inserted as a single batch.

Catches: Bulk tab exposes JSON export, file-picker import, and paste-JSON
import. Single-catch save lives on the Fangster tab.

Spots: Steder tab exposes JSON export and paste-JSON import. Single-spot CRUD
lives in the same tab.

Both export formats nest under `{ exportDate, totalX, [items] }` but the
importers also accept a bare top-level array for hand-edited input.

## AI parsing pipeline

1. User describes a catch in natural language in the AI modal.
2. Frontend POSTs `{ description }` to `/api/parse-catch`.
3. Route loads the spot registry, builds a system prompt including spots, calls
   OpenAI with JSON-mode, parses + validates, deterministic-derives `undersized`,
   confirms `spotId` against the registry.
4. Route returns the validated, normalized catch object.
5. Frontend renders a preview modal; on accept it populates the form (including
   `spotId`) for the user to confirm and save.

Verbose request/response logging is gated behind `DEBUG_AI_PARSE=1`. Error logs
are always on.

## Mapping layer between DB and frontend models

- `types/catch.ts` and `types/spot.ts` define DB / frontend / insert / update
  shapes.
- `lib/catch_mappers.ts` and `lib/spot_mappers.ts` provide:
  - `mapXFromDb` — snake_case row → camelCase frontend model
  - `toXInsertPayload` — camelCase model → snake_case insert payload
  - `toCatchUpdatePayload` — partial camelCase → partial snake_case
- This layer is where future per-source enrichment fields (e.g. weather) will
  be plugged in.

## Testing

- Vitest is wired up (`vitest.config.ts`, scripts `test` and `test:run`).
- Coverage:
  - `lib/catch_mappers.test.ts` — round-trip + null/empty + spotId behavior
  - `lib/catch-schema.test.ts` — date format, length coercion, spotId optionality
  - `lib/spot_mappers.test.ts` — spot mapping round-trip + update payload
  - `lib/spot-schema.test.ts` — tolerant defaults, coord coercion, alias validation
