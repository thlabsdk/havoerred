# 002 — Enrichment Pipeline

## Context

Historical environmental conditions (wind, temperature, water level, tide phase) are
operationally valuable for pattern analysis. Recording them manually at catch time is
too slow and error-prone in the field. Historical data can be fetched retrospectively
using catch date, time, and location coordinates.

## Decision

Implement an async server-side enrichment pipeline triggered after catch insert:

- Two providers: Open-Meteo (weather) and Open-Meteo Marine (water/tide)
- Providers run in parallel (`Promise.all`) — they are independent and IO-bound
- Each provider returns a typed `ProviderOutcome<T>` — never throws
- Partial success: if one provider fails, the other's data is persisted; status = `enriched`
- Full failure: both providers fail; status = `failed`, error logged
- Skip conditions: no `spot_id`, spot has no coordinates, unparseable date
- Idempotency: already-`enriched` catches are no-ops on re-trigger

Enrichment status machine: `pending` → `enriched` | `skipped` | `failed`.

Triggered via POST to `/api/enrich-catch` from the frontend after successful catch save.

## Consequences

- Enrichment is best-effort; the catch record is always saved first regardless of
  enrichment outcome.
- Enrichment requires a linked spot with coordinates — this creates a coupling between
  the spot registry and the enrichment pipeline.
- The `enrichment_status` field is indexed, enabling filtering by enrichment state.
- Fault injection support is in place for testing provider failure paths.
- Future providers can be added independently without changing the pipeline contract.
