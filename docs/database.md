# Database

## Current database schema

The project uses a single Supabase table named `catches`.

Table columns:
- `id` bigint primary key
- `date` text not null
- `location` text not null
- `fjord` text
- `bait` text not null
- `length_cm` integer
- `undersized` boolean default false
- `wind_direction` text
- `notes` text not null
- `created_at` timestamp with time zone not null default UTC now
- `updated_at` timestamp with time zone default UTC now

The schema is defined in `supabase/migrations/20260514043917_create_catches_table.sql`.

## snake_case vs camelCase strategy

- Database columns use `snake_case`.
- Frontend and application models use `camelCase`.
- Mapping functions in `lib/catch_mappers.ts` translate between these conventions.
- This keeps the frontend idiomatic while preserving conventional SQL naming.

## migrations workflow

- Schema changes are tracked in the `supabase/migrations/` folder.
- Use Supabase migration tooling to apply changes in development and production.
- Keep migration files small and descriptive.

## Supabase setup

- The frontend Supabase client is created in `lib/supabase.ts`.
- Required environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- These values should be present in `.env.local` for local development.

## mapping conventions

- `CatchFromDB` mirrors the DB row shape with snake_case field names.
- `Catch` is the frontend-facing shape with camelCase names.
- `CatchInsert` omits DB-managed fields and converts camelCase into snake_case for inserts.
- `CatchUpdate` is a partial version of frontend input, converted by `toCatchUpdatePayload`.
