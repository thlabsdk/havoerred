# Database

## Tables

The project uses two Supabase tables: `catches` and `spots`.

### `catches`

| Column          | Type                       | Notes                                  |
|-----------------|----------------------------|----------------------------------------|
| `id`            | bigint                     | identity, primary key                  |
| `date`          | text                       | not null, `dd/mm/yyyy`                 |
| `location`      | text                       | not null (free-form, may match a spot) |
| `fjord`         | text                       | nullable                               |
| `bait`          | text                       | not null                               |
| `length_cm`     | integer                    | nullable                               |
| `undersized`    | boolean                    | default false                          |
| `wind_direction`| text                       | nullable                               |
| `notes`         | text                       | not null                               |
| `spot_id`       | bigint references `spots`  | nullable, `on delete set null`         |
| `created_at`    | timestamptz                | not null, default UTC now              |
| `updated_at`    | timestamptz                | default UTC now                        |

Index: `catches_spot_id_idx` on `(spot_id)`.

Migration: `supabase/migrations/20260514043917_create_catches_table.sql` plus
`20260514120100_add_spot_id_to_catches.sql`.

### `spots`

The canonical registry of fishing spots. Catches reference spots via `spot_id` but
retain a free-form `location` string for back-compat and quick entry.

| Column          | Type                | Notes                                                                |
|-----------------|---------------------|----------------------------------------------------------------------|
| `id`            | bigint              | identity, primary key                                                |
| `name`          | text                | not null, canonical display name                                     |
| `aliases`       | text[]              | not null, default `'{}'`, alternative names for resolution           |
| `body_of_water` | text                | nullable, fjord/coast/lake name                                      |
| `latitude`      | double precision    | nullable, populated when a geolocation is added                      |
| `longitude`     | double precision    | nullable                                                             |
| `region`        | text                | nullable, e.g. "Sjælland"                                            |
| `notes`         | text                | nullable                                                             |
| `owner_user_id` | uuid                | nullable now; populated when auth ships                              |
| `created_at`    | timestamptz         | not null, default UTC now                                            |
| `updated_at`    | timestamptz         | default UTC now                                                      |

Constraints / indexes:
- `unique nulls not distinct (owner_user_id, name)` — same spot name cannot
  repeat per owner; treats two NULL owners as equal during the solo phase.
- `spots_body_of_water_idx` on `(body_of_water)`.
- `spots_owner_idx` on `(owner_user_id)`.

Migration: `supabase/migrations/20260514120000_create_spots_table.sql`.

## snake_case vs camelCase strategy

- Database columns use `snake_case`.
- Frontend and application models use `camelCase`.
- Mapping functions in `lib/catch_mappers.ts` and `lib/spot_mappers.ts` translate
  between these conventions.
- This keeps the frontend idiomatic while preserving conventional SQL naming.

## Migrations workflow

- Schema changes are tracked in `supabase/migrations/`.
- Apply with Supabase migration tooling (`supabase db push` or equivalent).
- Keep migration files small and descriptive. Never edit applied migrations —
  add a new one.

## Supabase client

- The frontend Supabase client is created in `lib/supabase.ts` (anon key).
- The AI parse route imports the same client server-side via `lib/spots_repo.ts`
  to read the spot registry before calling OpenAI.
- Required environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- These values should be present in `.env.local` for local development. See
  `.env.example` at the repo root.

## Mapping conventions

- `CatchFromDB` / `SpotFromDB` mirror the DB row shape with snake_case names.
- `Catch` / `Spot` are the frontend-facing shapes with camelCase names.
- `CatchInsert` / `SpotInsert` omit DB-managed fields and convert camelCase to
  snake_case for inserts.
- `CatchUpdate` is a partial version of frontend input, converted by
  `toCatchUpdatePayload`.
- Empty optional text fields (`fjord`, `wind_direction`, `spots.body_of_water`,
  `spots.region`, `spots.notes`) round-trip as `null` in the DB and `''` in the
  frontend.

## RLS

Not yet enabled. Both tables will gain owner-scoped RLS policies when auth
ships (Phase 5 of the roadmap).
