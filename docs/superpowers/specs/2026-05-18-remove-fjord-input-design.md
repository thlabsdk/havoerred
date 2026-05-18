# Remove Fjord Input — Design Spec

**Date:** 2026-05-18
**Branch:** `feature/remove-fjord-input`
**Sprint:** 4 — Task 2

---

## Problem

The catch form contains a manual Fjord text input. This is redundant: every known Spot already has a `bodyOfWater` field that holds exactly this value. Requiring the user to type it again at catch-logging time is friction with no data benefit.

## Goal

Remove the Fjord input from the catch form entirely. Derive `fjord` automatically at the submit boundary — only when a spot is selected. Unspotted catches store `''` as fjord.

Structured geographic metadata should derive only from structured spot entities.

## Scope

Three files. No new files, no type changes, no DB schema changes.

| File | Action |
|---|---|
| `components/CatchForm.tsx` | Remove Fjord input, remove `fjord`/`setFjord` props |
| `components/CatchesView.tsx` | Remove fjord state, compute fjord at submit |
| `components/SpotPicker.tsx` | Remove `currentFjordText` prop |

---

## Behavior

### At submit

```ts
fjord: spotId !== null
  ? spots.find((s) => s.id === spotId)?.bodyOfWater ?? ''
  : '',
```

- **Spot selected (`spotId !== null`):** fjord = `spot.bodyOfWater` (empty string if the spot has no `bodyOfWater` set)
- **No spot selected (`spotId === null`):** fjord = `''`

Derivation happens only at the submit boundary. No reactive state synchronization.

### Editing an existing catch

`editCatch` no longer sets `fjord` state (it no longer exists). All other fields populate as before. On re-submit, fjord is re-derived from the current `spotId`.

### AI parse modal

`applyAiResult` no longer applies `aiParsedResult.fjord` to state (fjord state removed). The AI-suggested fjord value is silently ignored. If the AI result includes a `spotId`, the fjord for that catch will be derived from the spot on submit.

### Inline spot creation

`SpotPicker.handleCreate` previously passed `currentFjordText` as the `bodyOfWater` for new spots. With the fjord field removed, it passes `''` instead. New spots created inline from the catch form have an empty `bodyOfWater`. This is editable later in the Spots management view.

---

## Changes Per File

### `components/CatchForm.tsx`

- Remove `fjord: string` and `setFjord: (value: string) => void` from `CatchFormProps`
- Remove both from the destructured function parameters
- Remove the Fjord `<label>` + `<input>` block from the JSX
- Remove the `currentFjordText={fjord}` prop passed to `<SpotPicker>` inside the form

### `components/CatchesView.tsx`

- Remove `const [fjord, setFjord] = useState('')`
- Remove `setFjord('')` from `resetForm`
- Remove `setFjord(catchItem.fjord)` from `editCatch`
- Remove `setFjord(aiParsedResult.fjord || '')` from `applyAiResult`
- In `handleSubmit`, replace `fjord` in the payload with the inline derivation:
  ```ts
  fjord: spotId !== null
    ? spots.find((s) => s.id === spotId)?.bodyOfWater ?? ''
    : '',
  ```
- Remove `fjord={fjord}` and `setFjord={setFjord}` from the `<CatchForm>` prop spread

### `components/SpotPicker.tsx`

- Remove `currentFjordText: string` from `SpotPickerProps`
- Remove from destructured parameters
- In `handleCreate`, replace `currentFjordText.trim()` with `''`:
  ```ts
  const newSpot = await onCreateSpot(trimmedLocation, '');
  ```

---

## What Does Not Change

- `fjord` column in the database — intact, historical data preserved
- `CatchInsert` type — still includes `fjord: string`
- `Catch`, `Spot`, `SpotInsert` types — unchanged
- All other form fields and validation — untouched
- `validateDate`, `validateForm`, error handling — untouched
- Spot management view (`SpotsView`, `SpotForm`) — unchanged

---

## Success Criteria

1. The Fjord input is absent from the catch form UI
2. Submitting a catch with a spot selected persists `spot.bodyOfWater` as `fjord` in the DB
3. Submitting a catch with no spot selected persists `''` as `fjord`
4. `editCatch` populates all other form fields correctly; no fjord-related error
5. Inline spot creation still works; new spot is created with empty `bodyOfWater`
6. Zero TypeScript errors (`tsc --noEmit` passes)
7. No regressions in other form fields or catch card display
