# Hide Location Free-Text When Spot Selected — Design Spec

**Date:** 2026-05-18
**Branch:** `s4/hide-location-when-spot-selected`
**Sprint:** 4 — Task 4

---

## Problem

The catch form shows both the structured SpotPicker and the free-text Sted input at the same time. When the user has already selected a Spot, the free-text field is redundant and visually noisy — the Spot is the authoritative geographic entity for that catch.

## Goal

Conditionally hide the free-text Sted input when a Spot is selected (`spotId !== null`). The field reappears if the selection is cleared.

## Design Principle

This continues Sprint 4's friction-reduction direction: fewer visible fields, faster capture flow, clearer entity-driven capture. Structured Spot selection and free-text location entry are two separate capture modes — this task makes them mutually exclusive in the UI without merging their data.

---

## Scope

One file. No new files, no type changes, no state changes, no validation changes.

| File | Action |
|---|---|
| `components/CatchForm.tsx` | Wrap Sted `<div>` in `{spotId === null && (...)}` |

---

## Behavior

### No spot selected (`spotId === null`)

Free-text Sted field is visible and editable. Identical to today's behavior.

### Spot selected (`spotId !== null`)

Free-text Sted field is absent from the DOM — no disabled state, no placeholder, no "derived from spot" messaging. The field simply does not render.

### Spot cleared

When the user removes the spot selection, `spotId` returns to `null` and the field reappears. The `location` state value is preserved (it was set to the spot's name when the spot was selected, per the existing `SpotPicker.onChange` handler). No reset, no auto-copy — it reappears with whatever value is in state.

---

## Why validation still works

The existing `SpotPicker.onChange` handler in `CatchesView.tsx` already sets `location` to the spot's name whenever a spot is selected:

```tsx
onChange={(id, name) => {
  setSpotId(id);
  if (name) {
    setLocation(name);
    ...
  }
}}
```

So when the Sted field is hidden, `location` is already populated with the spot name. `validateForm` continues to enforce `location.trim()` as required, and it will always pass when a spot is selected. No validation changes are needed.

---

## Implementation

### `components/CatchForm.tsx`

Find the existing Sted block:

```tsx
      <div>
        <label className="block mb-2 text-sm font-semibold text-slate-300">
          Sted (fritekst)
        </label>

        <input
          type="text"
          value={location}
          disabled={isDisabled}
          onChange={(e) => {
            setLocation(e.target.value);
            if (spotId !== null) setSpotId(null);
            if (errors.location) {
              clearFieldError('location');
            }
          }}
          placeholder="Fx Kyndby"
          className={`w-full bg-slate-800 border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
            errors.location
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-cyan-500'
          }`}
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-400">{errors.location}</p>
        )}
      </div>
```

Wrap with `{spotId === null && (...)}`:

```tsx
      {spotId === null && (
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-300">
            Sted (fritekst)
          </label>

          <input
            type="text"
            value={location}
            disabled={isDisabled}
            onChange={(e) => {
              setLocation(e.target.value);
              if (spotId !== null) setSpotId(null);
              if (errors.location) {
                clearFieldError('location');
              }
            }}
            placeholder="Fx Kyndby"
            className={`w-full bg-slate-800 border rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              errors.location
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-700 focus:ring-cyan-500'
            }`}
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-400">{errors.location}</p>
          )}
        </div>
      )}
```

---

## What does not change

- `location: string` state in `CatchesView.tsx` — unchanged
- `setLocation` calls in `SpotPicker.onChange` — unchanged
- `CatchFormProps` type — `location`, `setLocation`, `spotId`, `setSpotId` all present
- `validateForm` — no changes, location validation still enforced
- All other form fields — unchanged
- No animations, no transitions, no auto-copying, no state sync

---

## Testing

No unit-testable pure function is added. No `node`-environment test is appropriate for JSX conditional rendering.

Manual verification (dev server):

1. Open catch form with no spot selected — Sted field is visible
2. Select a spot — Sted field disappears immediately
3. Clear the spot — Sted field reappears
4. Type free text in Sted, then select a spot — Sted disappears; re-clearing spot restores the field with the spot name (set by SpotPicker.onChange)
5. Submit a catch with a spot selected — succeeds without location validation error
6. Submit a catch with no spot, no location text — validation error appears on Sted field as usual

---

## Success Criteria

1. Sted free-text field is absent when a Spot is selected
2. Sted free-text field is visible when no Spot is selected
3. Clearing a Spot selection restores the Sted field
4. Submitting with a selected Spot does not trigger a location validation error
5. Zero TypeScript errors (`tsc --noEmit`)
6. No regressions in other form fields or SpotPicker behavior
