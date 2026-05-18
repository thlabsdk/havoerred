# Date Input Auto-Formatting — Design Spec

**Date:** 2026-05-18
**Branch:** `feature/date-input-mask`
**Sprint:** 4 — Task 1

---

## Problem

The catch form date field (`dd/mm/yyyy`) requires the user to type slashes manually. On mobile this is two keyboard switches per slash — significant friction during fast field logging.

## Goal

User types digits only. The field auto-inserts slashes as they go. Pasted input with any common separator is normalized automatically.

## Scope

Single change: the date `<input>` in `CatchForm.tsx`. No other files touched.

---

## Behavior

### Formatting rule

Strip all non-digit characters from the raw input, take the first 8 digits, and insert `/` after positions 2 and 4:

```
digits 1-2   → dd
digits 1-4   → dd/mm
digits 1-8   → dd/mm/yyyy
```

### Examples — all produce `12/05/2026`

| User action | Raw value received | Formatted output |
|---|---|---|
| Types `12052026` | `12052026` | `12/05/2026` |
| Pastes `12-05-2026` | `12-05-2026` | `12/05/2026` |
| Pastes `12.05.2026` | `12.05.2026` | `12/05/2026` |

### Partial entry while typing

| Digits typed | Field shows |
|---|---|
| `1` | `1` |
| `12` | `12` |
| `120` | `12/0` |
| `1205` | `12/05` |
| `12050` | `12/05/0` |
| `12052026` | `12/05/2026` |

### Backspace

Natural — user deletes formatted characters. No special backspace interception. The cursor-jump edge case (mid-field edits) is accepted as an acceptable tradeoff for this scope.

### Mobile keyboard

`inputMode="numeric"` triggers the numeric keypad on iOS and Android. `type="text"` is preserved (not `type="date"`) so the browser date picker is not invoked.

---

## Implementation

**File:** `components/CatchForm.tsx`

**Change:** Replace the bare `onChange` handler on the date input with one that reformats via a local `formatDateInput` function defined at module scope.

```ts
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
```

**Input element delta:**
- Add `inputMode="numeric"`
- Wrap `setDate` call: `setDate(formatDateInput(e.target.value))`

**Validation:** No change. `validateDate` already expects `dd/mm/yyyy` — the formatter produces exactly that format when 8 digits are present.

---

## What this does NOT include

- No custom hook
- No masking library
- No cursor position management
- No `onKeyDown` interceptor
- No change to validation logic
- No change to any other form field

---

## Success criteria

1. Typing `12052026` produces `12/05/2026` in the field
2. Pasting `12-05-2026` or `12.05.2026` produces `12/05/2026`
3. Partial entry `12/05` is preserved correctly mid-type
4. Numeric keypad appears on iOS/Android
5. Existing validation still catches invalid dates on submit
6. No regressions in other form fields
