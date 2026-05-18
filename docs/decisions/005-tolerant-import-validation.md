# 005 — Tolerant Import Validation

## Context

Historical catch exports and hand-edited JSON may have missing optional fields,
legacy field shapes, or rows that don't fully match the current schema. Strict
validation that rejects the entire import on any invalid row makes bulk ingestion
brittle and unusable for real operational data.

## Decision

Use tolerant, row-level validation for all JSON imports (catches and spots):

- Each row is validated independently via Zod
- Invalid rows are logged and skipped; valid rows continue
- Zod schemas default missing optional fields rather than rejecting the row
- `spotId` is optional in `catchSchema` so pre-spot-registry exports still validate
- Importers accept both `{ exportDate, totalX, items: [...] }` envelope and bare arrays

The Supabase insert is batched from the set of valid rows only.

## Consequences

- An import with some invalid rows always partially succeeds — no all-or-nothing semantics
- Invalid rows are surfaced in the UI but do not block the valid batch
- Schema evolution is backwards-compatible: new required fields need defaults, not
  hard rejections, to avoid breaking historical exports
- This is appropriate for a single-user system where the user controls the import data
  and partial success is preferable to a failed import
