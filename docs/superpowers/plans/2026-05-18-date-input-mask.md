# Date Input Auto-Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate manual `/` entry in the catch form date field by auto-inserting slashes as the user types digits.

**Architecture:** A single pure function `formatDateInput` strips non-digits from the raw input value, caps at 8 digits, and inserts `/` at positions 2 and 4. It is added as a named export in `CatchForm.tsx` and wired into the existing `onChange` handler. No new files, no abstraction layer, no masking library.

**Tech Stack:** React 19, Next.js 16, TypeScript, Vitest 4

---

## File Map

| File | Action | What changes |
|---|---|---|
| `components/CatchForm.tsx` | Modify | Add `export function formatDateInput`, update date `<input>` onChange, add `inputMode="numeric"` |
| `components/CatchForm.test.ts` | Create | Unit tests for `formatDateInput` covering all spec cases |

---

## Task 1: Create the feature branch

- [ ] **Step 1: Create and switch to the feature branch**

  ```bash
  git checkout -b feature/date-input-mask
  ```

  Expected: `Switched to a new branch 'feature/date-input-mask'`

- [ ] **Step 2: Verify you are on the right branch**

  ```bash
  git branch --show-current
  ```

  Expected: `feature/date-input-mask`

---

## Task 2: Write failing tests for `formatDateInput`

`formatDateInput` does not exist yet in `CatchForm.tsx`. The test file imports it by name — so running the test suite at this point will fail with a module error. That is the expected red state.

- [ ] **Step 1: Create the test file**

  Create `components/CatchForm.test.ts` with this content:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { formatDateInput } from './CatchForm';

  describe('formatDateInput', () => {
    it('returns empty string for empty input', () => {
      expect(formatDateInput('')).toBe('');
    });

    it('returns single digit unchanged', () => {
      expect(formatDateInput('1')).toBe('1');
    });

    it('returns two digits unchanged', () => {
      expect(formatDateInput('12')).toBe('12');
    });

    it('inserts slash after 2 digits', () => {
      expect(formatDateInput('120')).toBe('12/0');
    });

    it('formats dd/mm on 4 digits', () => {
      expect(formatDateInput('1205')).toBe('12/05');
    });

    it('inserts slash after 4 digits', () => {
      expect(formatDateInput('12050')).toBe('12/05/0');
    });

    it('formats full date on 8 digits', () => {
      expect(formatDateInput('12052026')).toBe('12/05/2026');
    });

    it('normalizes dash-separated paste', () => {
      expect(formatDateInput('12-05-2026')).toBe('12/05/2026');
    });

    it('normalizes dot-separated paste', () => {
      expect(formatDateInput('12.05.2026')).toBe('12/05/2026');
    });

    it('normalizes leading and trailing whitespace', () => {
      expect(formatDateInput(' 12052026 ')).toBe('12/05/2026');
    });

    it('normalizes whitespace around slash-separated paste', () => {
      expect(formatDateInput(' 12/05/2026 ')).toBe('12/05/2026');
    });

    it('caps at 8 digits even with extra input', () => {
      expect(formatDateInput('1205202699')).toBe('12/05/2026');
    });
  });
  ```

- [ ] **Step 2: Run the test suite to confirm failure**

  ```bash
  npm run test:run -- components/CatchForm.test.ts
  ```

  Expected: error similar to:
  ```
  SyntaxError: The requested module '...CatchForm' does not provide an export named 'formatDateInput'
  ```
  or a TypeScript type error about the missing export. This is the expected red state.

---

## Task 3: Implement `formatDateInput` and update the date input

All changes are in `components/CatchForm.tsx`.

- [ ] **Step 1: Add `formatDateInput` as a named export above the existing `validateDate` function**

  Open `components/CatchForm.tsx`. The file currently starts with `'use client';` followed by imports. Find the line:

  ```ts
  const validateDate = (dateStr: string): string | undefined => {
  ```

  Insert the following block immediately before it (after the imports, before `validateDate`):

  ```ts
  export function formatDateInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  ```

- [ ] **Step 2: Update the date `<input>` element**

  Find the existing date input (around line 191 in the original file):

  ```tsx
  <input
    type="text"
    value={date}
    disabled={isDisabled}
    onChange={(e) => {
      setDate(e.target.value);
      if (errors.date) {
        clearFieldError('date');
      }
    }}
    placeholder="dd/mm/yyyy"
    className={...}
  />
  ```

  Replace the `onChange` handler and add `inputMode`:

  ```tsx
  <input
    type="text"
    inputMode="numeric"
    value={date}
    disabled={isDisabled}
    onChange={(e) => {
      setDate(formatDateInput(e.target.value));
      if (errors.date) {
        clearFieldError('date');
      }
    }}
    placeholder="dd/mm/yyyy"
    className={...}
  />
  ```

  The only two changes are:
  1. `inputMode="numeric"` added as a new prop
  2. `setDate(e.target.value)` → `setDate(formatDateInput(e.target.value))`

  Leave `className`, `placeholder`, `value`, `disabled`, and the error-clearing logic exactly as they are.

- [ ] **Step 3: Run the tests to confirm they pass**

  ```bash
  npm run test:run -- components/CatchForm.test.ts
  ```

  Expected output:
  ```
  ✓ components/CatchForm.test.ts (12)
    ✓ formatDateInput > returns empty string for empty input
    ✓ formatDateInput > returns single digit unchanged
    ✓ formatDateInput > returns two digits unchanged
    ✓ formatDateInput > inserts slash after 2 digits
    ✓ formatDateInput > formats dd/mm on 4 digits
    ✓ formatDateInput > inserts slash after 4 digits
    ✓ formatDateInput > formats full date on 8 digits
    ✓ formatDateInput > normalizes dash-separated paste
    ✓ formatDateInput > normalizes dot-separated paste
    ✓ formatDateInput > normalizes leading and trailing whitespace
    ✓ formatDateInput > normalizes whitespace around slash-separated paste
    ✓ formatDateInput > caps at 8 digits even with extra input

  Test Files  1 passed (1)
  Tests       12 passed (12)
  ```

---

## Task 4: Commit

- [ ] **Step 1: Stage both changed files**

  ```bash
  git add components/CatchForm.tsx components/CatchForm.test.ts
  ```

- [ ] **Step 2: Commit**

  ```bash
  git commit -m "feat: auto-format date input — strip non-digits, insert slashes on type/paste"
  ```

---

## Task 5: Merge to main

- [ ] **Step 1: Switch to main**

  ```bash
  git checkout main
  ```

- [ ] **Step 2: Merge the feature branch**

  ```bash
  git merge feature/date-input-mask
  ```

  Expected: fast-forward merge, no conflicts.

- [ ] **Step 3: Delete the feature branch**

  ```bash
  git branch -d feature/date-input-mask
  ```

- [ ] **Step 4: Verify final state**

  ```bash
  git log --oneline -3
  ```

  Expected: the feature commit at the top of `main`.

---

## Manual Verification Checklist

After merging, start the dev server (`npm run dev`) and open the catch form:

- [ ] Type `12052026` — field shows `12/05/2026`
- [ ] Type `1` then `2` then `0` — field shows `12/0` at the third keystroke
- [ ] Paste `12-05-2026` — field normalizes to `12/05/2026`
- [ ] Paste `12.05.2026` — field normalizes to `12/05/2026`
- [ ] On mobile (or Chrome DevTools device emulation) — numeric keypad appears on the date field
- [ ] Submit form with partial date `12/05` — existing validation fires: "Dato skal være i format dd/mm/yyyy"
- [ ] All other form fields behave exactly as before
