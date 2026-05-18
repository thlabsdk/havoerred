# Length Input Mobile Keyboard Optimization — Design Spec

**Date:** 2026-05-18
**Branch:** `s4/length-input-keyboard`
**Sprint:** 4 — Task 3

---

## Problem

The catch form length field uses `type="number"`, which triggers a mobile keyboard that includes a decimal point and negative sign. Fish length is always a positive integer (cm). The wrong keyboard keys are present, adding friction to every catch entry.

## Goal

Replace `type="number"` with `type="text"` + `inputMode="numeric"` so the mobile numpad shows only digit keys. Strip non-digit input noise inline on `onChange` using a pure exported function.

## Design Principle

Same philosophy as the date input improvement: small, invisible, friction-reducing field ergonomics. No blocking handlers, no blur validation, no abstractions.

---

## Scope

Two files. No new files, no type changes, no state changes in parent components.

| File | Action |
|---|---|
| `components/CatchForm.tsx` | Add `parseLengthInput` named export, update length `<input>` |
| `components/CatchForm.test.ts` | Add `parseLengthInput` describe block (existing file) |

---

## Implementation

### `parseLengthInput` function

Added as a named export in `components/CatchForm.tsx`, immediately after `formatDateInput`:

```ts
export function parseLengthInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  return digits === '' ? null : Number(digits);
}
```

- Strips all non-digit characters
- Empty result → `null` (field is optional)
- Any digits → integer via `Number()`
- Produces the same `number | null` type that the parent state (`lengthCm`) already expects — no upstream changes required

### Length input element

```tsx
<input
  type="text"
  inputMode="numeric"
  autoComplete="off"
  maxLength={3}
  value={lengthCm !== null ? String(lengthCm) : ''}
  disabled={isDisabled}
  onChange={(e) => setLengthCm(parseLengthInput(e.target.value))}
  placeholder="Fx 67"
  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
/>
```

**Removed:** `type="number"`, `min={0}`, `step={1}`, the multi-line `onChange` handler.

**Added:** `type="text"`, `inputMode="numeric"`, `autoComplete="off"`, `maxLength={3}`.

`className`, `placeholder`, `disabled`, and `value` shape are preserved.

---

## Normalization behavior

| Input | Result | Rationale |
|---|---|---|
| `''` | `null` | field is optional |
| `'67'` | `67` | normal entry |
| `'67cm'` | `67` | clear non-digit suffix noise |
| `'-5'` | `5` | negative sign stripped |
| `'abc'` | `null` | all non-digits → empty |

Note: `inputMode="numeric"` on iOS shows a digit-only numpad. Android may still show a decimal point key — stripping non-digits in `onChange` handles this transparently. Decimal input (e.g. `"6.7"`) is not an endorsed normalization path: it would silently produce `67`, which is semantically wrong. The mobile keyboard prevents it in the primary use case.

---

## Tests

Added as a new `describe` block in the existing `components/CatchForm.test.ts`:

```ts
describe('parseLengthInput', () => {
  it('returns null for empty string', ...)
  it('returns number for digit string', ...)
  it('strips non-digit suffix noise', ...)   // "67cm" → 67
  it('strips negative sign', ...)            // "-5" → 5
  it('returns null for all non-digits', ...) // "abc" → null
})
```

Five cases. The `"6.7" → 67` transformation is intentionally NOT tested: it is a side effect of the regex, not an endorsed normalization behavior.

---

## What does not change

- `lengthCm: number | null` state in `CatchesView.tsx` — unchanged
- All other form fields — unchanged
- `CatchFormProps` — unchanged
- Validation logic — no length validation exists and none is added
- `formatDateInput` tests in `CatchForm.test.ts` — untouched

---

## Success Criteria

1. Mobile numpad on the length field shows digit keys only (no decimal, no negative)
2. Typing `67` sets `lengthCm` to `67`
3. Clearing the field sets `lengthCm` to `null`
4. Pasting `"67cm"` produces `67`
5. All 5 `parseLengthInput` tests pass
6. Existing 13 `formatDateInput` tests still pass
7. Zero TypeScript errors (`npx tsc --noEmit`)
8. No regressions in other form fields
