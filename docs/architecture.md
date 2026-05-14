# Havørredloggen Architecture

## Overall

Havørredloggen is a Next.js 16 app for logging Danish sea trout catches with an
AI-assisted parse helper. The app is a single client-rendered page that talks to
Supabase for persistence and to one server route (`/api/parse-catch`) for AI
parsing. The AI route now also reads from the spot registry so the model can
resolve spot names instead of merely extracting them.

## Frontend structure

- `app/page.tsx` is the main client component (still monolithic; split planned).
- React state hooks own form fields, modals, search, edit state, catches list,
  and the spot registry.
- Subcomponents: `CatchForm` (controlled), `CatchCard`, `StatsCards`, and
  `SpotPicker`.
- UI render is gated by `hydrated` to avoid hydration mismatches.
- Initial load fetches `catches` and `spots` in parallel via `Promise.allSettled`.

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
- `lib/spots_repo.ts` exposes `fetchSpots()` and `createSpot()`.
- `components/SpotPicker.tsx` is a dropdown + "create from current text"
  control rendered above the location input in `CatchForm`.
- Editing the location free-text clears `spotId` so the two stay consistent.

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

- The frontend supports JSON import via a paste modal and a file picker, and
  JSON export to a downloaded file.
- Import flow:
  1. User pastes JSON or picks a file.
  2. The app parses the JSON and validates each entry against `catchSchema`.
  3. Valid catches are inserted into Supabase via `supabase.from('catches').insert(...)`.
  4. Invalid entries are skipped and reported.
  5. The UI updates with the new rows.

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
  - `lib/spot_mappers.test.ts` — spot mapping round-trip
