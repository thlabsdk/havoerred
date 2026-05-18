# 007 — Additive Migrations

## Context

Schema changes are applied to a live Supabase instance. Once a migration is applied,
editing it creates a divergence between the migration file and the actual DB state.
This makes it impossible to reconstruct the schema from migration history and breaks
Supabase migration tooling.

## Decision

All schema changes are implemented as new migration files. Applied migrations are never
edited.

- Each file makes one logical change (create table, add column, add index, create view)
- Files are named with a UTC timestamp prefix: `YYYYMMDDHHMMSS_description.sql`
- Applied migrations are canonical and permanent
- `supabase db push` (or equivalent) applies pending migrations in order

## Consequences

- Migration history is a complete, ordered, append-only record of schema evolution
- Schema can be reconstructed from scratch by replaying all migrations
- Backfills and corrections require explicit new migrations (e.g., `20260516120100_backfill_undersized_from_length_cm.sql`)
- Transitional schema states (like `catches.date` as TEXT) are explicit and documented
  in the migration that introduced the workaround
