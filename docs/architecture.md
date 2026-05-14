# Havørredloggen Architecture

## Overall app architecture

Havørredloggen is a small Next.js 16 app with a client-rendered homepage and one dedicated API route for AI-assisted parsing. The app is built around a single page that manages catches, imports data, and calls a server-side API to parse natural language descriptions.

## Frontend structure

- `app/page.tsx` is the main client component.
- It uses React state hooks for form fields, modal state, import text, and parsed AI results.
- The page includes:
  - a catch entry/edit form
  - catch list rendering
  - JSON import modal
  - AI parse modal
  - Supabase data loading and insert logic
- UI state is guarded by `hydrated` state to avoid hydration mismatches.

## Supabase integration

- `lib/supabase.ts` creates a Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- The frontend uses Supabase for:
  - fetching existing catches
  - inserting new catches from JSON import
  - optionally updating/deleting catches through the same client
- The database table is mapped to frontend models through `lib/catch_mappers.ts`.

## API route architecture

- `app/api/parse-catch/route.ts` exposes a POST route for AI catch parsing.
- It is a server-only endpoint that:
  - validates incoming request payloads
  - calls the OpenAI SDK
  - parses the AI response
  - validates the parsed object against Zod
  - returns structured JSON or a detailed error
- The route keeps the frontend architecture intact by only serving parsed catch objects.

## Zod validation flow

- `lib/catch-schema.ts` defines `catchSchema` with the expected catch fields.
- The backend route validates the AI response with `catchSchema.safeParse(...)`.
- If validation fails, the route returns a structured error object with `details`.
- This ensures the frontend only receives valid catch payloads.

## Import/export pipeline

- The frontend supports JSON import via a paste modal.
- The import flow:
  1. User pastes JSON data into the modal.
  2. The app parses the JSON and validates or normalizes it.
  3. Valid catches are inserted into Supabase with `supabase.from('catches').insert(...)`.
  4. The UI updates with newly imported catches.
- The import pipeline is direct and data-centric, with errors surfaced in the UI.

## AI parsing pipeline

- The user provides a natural language description in `app/page.tsx`.
- The frontend sends this description to `/api/parse-catch`.
- The backend builds an OpenAI chat completion request and logs:
  - incoming request body
  - request payload
  - raw OpenAI response
  - parsed JSON result
  - Zod validation outcome
- The route returns a validated catch object or a structured error.
- The frontend handles response status, parses body safely, and logs full details.

## Mapping layer between DB and frontend models

- `types/catch.ts` defines TypeScript models for:
  - `Catch`
  - `CatchFromDB`
  - `CatchInsert`
  - `CatchUpdate`
- `lib/catch_mappers.ts` contains:
  - `mapCatchFromDb` to convert snake_case DB rows to camelCase frontend models
  - `toCatchInsertPayload` to convert user-facing catch objects to DB insert payloads
  - `toCatchUpdatePayload` to build partial update payloads for Supabase
- This mapping layer isolates database naming conventions from frontend code.
