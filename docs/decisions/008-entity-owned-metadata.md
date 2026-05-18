# 008 — Entity-Owned Metadata

## Context

Early captures required manually entering derived data: the `fjord` field duplicated
information that could be inferred from the location. This created inconsistency
(same fjord entered as "Isefjorden", "Ise Fjord", "Isefjord"), made catch data harder
to query, and added form friction in the field.

## Decision

Structured metadata belongs to the entity that owns it, not to the observation record
that references it.

Applied:
- `fjord` on a catch is derived from `spot.bodyOfWater`, not entered manually
- `spot.region`, `spot.latitude`, `spot.longitude` are canonical on the spot entity;
  catches access them via the FK join (see `catch_analytics_view`)
- AI parse route reads spot metadata from the registry; it does not re-derive it from
  free-form text

The principle: when a structured entity is linked, the entity's fields are the source
of truth for any metadata that would otherwise be re-entered on the observation.

## Consequences

- Catch records become leaner as more metadata migrates to referenced entities
- Unlinked catches (no `spot_id`) lose derived metadata — this is acceptable; the
  fallback is the free-form `location` field
- Future entity-owned fields (e.g., bait registry for bait type metadata) follow
  the same pattern: link entity, derive metadata, remove manual entry
- Querying by fjord, region, or body of water requires joining through `spots` —
  `catch_analytics_view` provides this join pre-built
