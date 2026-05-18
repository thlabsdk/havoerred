# 001 — Structured Spot Registry

## Context

Early catch records used a free-form `location` text field. This worked for quick
entry but produced inconsistent names ("Kyndby", "Kyndby Havn", "kyndby havn"),
made AI spot matching unreliable, and blocked geo-based enrichment (which requires
coordinates).

## Decision

Introduce a canonical `spots` table with:
- a primary `name` (canonical display form)
- an `aliases` array for resolution from alternative names
- `latitude` / `longitude` for enrichment
- `body_of_water` as the authoritative source of the fjord/water field
- FK `catches.spot_id` referencing `spots.id` (`on delete set null`)

The free-form `catches.location` text is preserved for back-compat and unstructured
entry. When `spot_id` is set it takes precedence.

SpotPicker in the capture form provides inline spot selection and "create from current
text" to bridge unstructured → structured entry.

## Consequences

- Enrichment (weather, water) requires `spot_id` + spot coordinates. Unlinked catches
  are marked `enriched_status = skipped`.
- AI parse route loads the spot registry and injects canonical names + aliases into the
  system prompt, enabling accurate name resolution and hallucinated-ID defense.
- Deleting a spot nulls `catch.spot_id` — existing catches retain free-text location.
- Dual capture mode is intentional: structured (spot linked) and unstructured (free text)
  coexist. Structured is preferred for field intelligence; unstructured is the fallback.
