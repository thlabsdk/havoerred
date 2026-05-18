# Length Input Mobile Keyboard Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the length field's `type="number"` with `type="text"` + `inputMode="numeric"` so mobile shows the platform's numeric keypad, and add a pure `parseLengthInput` function that strips non-digit noise inline.

**Architecture:** One named export (`parseLengthInput`) added to `CatchForm.tsx` immediately after `formatDateInput`. The length `<input>` element is updated in place. Tests are added as a second `describe` block in the existing `CatchForm.test.ts`. No upstream state changes — `parseLengthInput` produces the same `number | null` type the parent already expects.

**Tech Stack:** React 19, Next.js 16, TypeScript, Vitest 4

---

## File Map

| File | Action | What changes |
|---|---|---|
| `components/CatchForm.tsx` | Modify | Add `export function parseLengthInput`, swap length `<input>` attributes |
| `components/CatchForm.test.ts` | Modify | Add `parseLengthInput` import + new `describe` block (13 existing tests untouched) |

---

## Task 1: Create feature branch

- [ ] **Step 1: Create and switch to the feature branch**

  ```bash
  git checkout -b s4/length-input-keyboard
  ```

  Expected: `Switched to a new branch 's4/length-input-keyboard'`

- [ ] **Step 2: Verify**

  ```bash
  git branch --show-current
  ```

  Expected: `s4/length-input-keyboard`

---

## Task 2: Write failing tests for `parseLengthInput`

`parseLengthInput` does not exist yet. The import will fail — that is the expected red state.

- [ ] **Step 1: Update the import line in `components/CatchForm.test.ts`**

  Find the current import at the top of the file:

  ```ts
  import { formatDateInput } from './CatchForm';
  ```

  Replace with:

  ```ts
  import { formatDateInput, parseLengthInput } from './CatchForm';
  ```

- [ ] **Step 2: Add the `parseLengthInput` describe block at the end of `components/CatchForm.test.ts`**

  Append after the closing `});` of the existing `formatDateInput` describe block:

  ```ts
  describe('parseLengthInput', () => {
    it('returns null for empty string', () => {
      expect(parseLengthInput('')).toBeNull();
    });

    it('returns number for digit string', () => {
      expect(parseLengthInput('67')).toBe(67);
    });

    it('strips non-digit suffix noise', () => {
      expect(parseLengthInput('67cm')).toBe(67);
    });

    it('strips negative sign', () => {
      expect(parseLengthInput('-5')).toBe(5);
    });

    it('returns null for all non-digits', () => {
      expect(parseLengthInput('abc')).toBeNull();
    });
  });
  ```

- [ ] **Step 3: Run the tests to confirm failure (red state)**

  ```bash
  npm run test:run -- components/CatchForm.test.ts
  ```

  Expected: error about `parseLengthInput` not being exported from `./CatchForm`. The 13 existing `formatDateInput` tests may still pass or the whole file may fail to import — either is acceptable as a red state. Proceed to Task 3.

---

## Task 3: Implement `parseLengthInput` and update the length input

Both changes are in `components/CatchForm.tsx`.

- [ ] **Step 1: Add `parseLengthInput` immediately after `formatDateInput`**

  Find this block in `components/CatchForm.tsx`:

  ```ts
  export function formatDateInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  ```

  Insert immediately after it (before `const validateDate`):

  ```ts
  export function parseLengthInput(raw: string): number | null {
    const digits = raw.replace(/\D/g, '');
    return digits === '' ? null : Number(digits);
  }
  ```

- [ ] **Step 2: Update the length `<input>` element**

  Find the existing length input in `components/CatchForm.tsx`:

  ```tsx
          <input
            type="number"
            min={0}
            step={1}
            value={lengthCm ?? ''}
            disabled={isDisabled}
            onChange={(e) => {
              const value = e.target.value;
              setLengthCm(value === '' ? null : Number(value));
            }}
            placeholder="Fx 67"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
          />
  ```

  Replace it with:

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

  The changes are:
  - `type="number"` → `type="text"`
  - Remove `min={0}` and `step={1}`
  - Add `inputMode="numeric"`, `autoComplete="off"`, `maxLength={3}`
  - `value={lengthCm ?? ''}` → `value={lengthCm !== null ? String(lengthCm) : ''}`
  - Multi-line `onChange` → `onChange={(e) => setLengthCm(parseLengthInput(e.target.value))}`
  - `className` and `placeholder` are unchanged

- [ ] **Step 3: Run the full test suite to confirm all 18 tests pass**

  ```bash
  npm run test:run -- components/CatchForm.test.ts
  ```

  Expected output:
  ```
  ✓ components/CatchForm.test.ts (18)
    ✓ formatDateInput (13)
    ✓ parseLengthInput (5)

  Test Files  1 passed (1)
  Tests       18 passed (18)
  ```

- [ ] **Step 4: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no output (zero errors).

---

## Task 4: Commit

- [ ] **Step 1: Stage both files**

  ```bash
  git add components/CatchForm.tsx components/CatchForm.test.ts
  ```

- [ ] **Step 2: Commit**

  ```bash
  git commit -m "feat: replace length type=number with text+inputMode, add parseLengthInput"
  ```

---

## Task 5: Merge to main

- [ ] **Step 1: Switch to main**

  ```bash
  git checkout main
  ```

- [ ] **Step 2: Merge**

  ```bash
  git merge s4/length-input-keyboard
  ```

  Expected: fast-forward merge, no conflicts.

- [ ] **Step 3: Delete feature branch**

  ```bash
  git branch -d s4/length-input-keyboard
  ```

- [ ] **Step 4: Verify**

  ```bash
  git log --oneline -3
  ```

  Expected: the feature commit at the top of `main`.

---

## Manual Verification Checklist

After merging, start the dev server (`npm run dev`) and open the catch form on a mobile device or Chrome DevTools device emulation:

- [ ] Tapping the Længde (cm) field shows the platform's numeric keypad
- [ ] Typing `67` shows `67` in the field and sets the value correctly
- [ ] Clearing the field sets length to empty (no value submitted)
- [ ] Pasting `67cm` shows `67`
- [ ] The field accepts at most 3 characters (maxLength)
- [ ] All other form fields behave exactly as before
- [ ] Submitting a catch with a length value still works end-to-end
