# 006 — Mobile-First Capture

## Context

Catches are logged in the field — at the waterside, at night, often in awkward
conditions. The capture form must work on a phone in portrait orientation with one
hand. Standard web form patterns (type=number, raw date fields, large visual footprint)
create unnecessary friction in this context.

## Decision

Optimize all capture UX for mobile field use:

- Date field: `inputMode="numeric"`, live auto-format `ddmmyyyy` → `DD/MM/YYYY`
  without a masking library
- Length field: `type="text" inputMode="numeric"` to avoid type=number browser
  inconsistencies and allow normalization-based parsing
- Fjord field removed: derived from spot entity, not manually entered
- Location field: hidden when a spot is selected, removing visual noise and duplicate
  entry
- SpotPicker: inline "create from current text" to bridge quick entry → structured entity
  in a single step

These are capture-time ergonomics, not display-time. The catch list and stats
views are secondary to the form.

## Consequences

- Reduced required fields in the form → faster cold-start logging
- `inputMode="numeric"` requires normalization/coercion at save time — `coerceLengthCm`
  handles this
- Dual capture mode (free-text vs. structured) is a first-class design constraint, not
  a workaround
- Future capture improvements should be evaluated against real field friction, not
  speculative redesign
