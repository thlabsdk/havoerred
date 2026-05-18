# Remove Fjord Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the manual Fjord text input from the catch form and derive `fjord` automatically from the selected spot's `bodyOfWater` at submit time.

**Architecture:** Pure deletion across three files plus a single named export (`deriveFjord`) added to `CatchesView.tsx` for testability. No reactive state sync — fjord is computed inline at the submit boundary only. All three file changes must land in one commit because they are interdependent: TypeScript will reject the partial state.

**Tech Stack:** React 19, Next.js 16, TypeScript, Vitest 4

---

## File Map

| File | Action | What changes |
|---|---|---|
| `components/CatchesView.tsx` | Modify | Add `export function deriveFjord`, remove fjord state + all setFjord calls, compute fjord at submit |
| `components/CatchForm.tsx` | Modify | Remove `fjord`/`setFjord` props and the Fjord `<input>` block, remove `currentFjordText` from SpotPicker |
| `components/SpotPicker.tsx` | Modify | Remove `currentFjordText` prop, pass `''` to `onCreateSpot` |
| `components/CatchesView.test.ts` | Create | Unit tests for `deriveFjord` |

---

## Task 1: Create the feature branch

- [ ] **Step 1: Create and switch to the feature branch**

  ```bash
  git checkout -b feature/remove-fjord-input
  ```

  Expected: `Switched to a new branch 'feature/remove-fjord-input'`

- [ ] **Step 2: Verify**

  ```bash
  git branch --show-current
  ```

  Expected: `feature/remove-fjord-input`

---

## Task 2: Write failing tests for `deriveFjord`

`deriveFjord` does not exist yet — the import will fail. That is the expected red state.

- [ ] **Step 1: Create `components/CatchesView.test.ts`**

  ```ts
  import { describe, it, expect } from 'vitest';
  import { deriveFjord } from './CatchesView';
  import type { Spot } from '../types/spot';

  const SPOTS: Spot[] = [
    {
      id: 1,
      name: 'Kyndby',
      aliases: [],
      bodyOfWater: 'Roskilde Fjord',
      latitude: null,
      longitude: null,
      region: 'Sjælland',
      notes: '',
      ownerUserId: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Frederikssund',
      aliases: [],
      bodyOfWater: '',
      latitude: null,
      longitude: null,
      region: 'Sjælland',
      notes: '',
      ownerUserId: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  describe('deriveFjord', () => {
    it('returns empty string when spotId is null', () => {
      expect(deriveFjord(SPOTS, null)).toBe('');
    });

    it('returns spot bodyOfWater when spot is found', () => {
      expect(deriveFjord(SPOTS, 1)).toBe('Roskilde Fjord');
    });

    it('returns empty string when spot has no bodyOfWater', () => {
      expect(deriveFjord(SPOTS, 2)).toBe('');
    });

    it('returns empty string when spotId is not in the spots list', () => {
      expect(deriveFjord(SPOTS, 999)).toBe('');
    });
  });
  ```

- [ ] **Step 2: Run the tests to confirm failure (red state)**

  ```bash
  npm run test:run -- components/CatchesView.test.ts
  ```

  Expected: error about `deriveFjord` not being exported from `./CatchesView`. This is correct — proceed to Task 3.

---

## Task 3: Implement all three file changes

All three files must be edited before TypeScript compiles cleanly. Do them in order, then verify.

### 3a — `components/CatchesView.tsx`

- [ ] **Step 1: Add `deriveFjord` as a named export**

  Find this line near the top of the component section (after imports, before the `type ToastFn` line):

  ```ts
  type ToastFn = (text: string, type: 'success' | 'error') => void;
  ```

  Insert immediately before it:

  ```ts
  export function deriveFjord(spots: Spot[], spotId: number | null): string {
    if (spotId === null) return '';
    return spots.find((s) => s.id === spotId)?.bodyOfWater ?? '';
  }

  ```

- [ ] **Step 2: Remove the `fjord` state declaration**

  Find and delete this line:

  ```ts
    const [fjord, setFjord] = useState('');
  ```

- [ ] **Step 3: Update `resetForm` — remove `setFjord`**

  Replace:

  ```ts
  function resetForm() {
    setDate('');
    setTimeOfDay('');
    setLocation('');
    setFjord('');
    setBait('');
    setLengthCm(null);
    setNotes('');
    setSpotId(null);
    setEditingId(null);
  }
  ```

  With:

  ```ts
  function resetForm() {
    setDate('');
    setTimeOfDay('');
    setLocation('');
    setBait('');
    setLengthCm(null);
    setNotes('');
    setSpotId(null);
    setEditingId(null);
  }
  ```

- [ ] **Step 4: Update `editCatch` — remove `setFjord`**

  Replace:

  ```ts
  function editCatch(catchItem: Catch) {
    setEditingId(catchItem.id);
    setDate(catchItem.date);
    setTimeOfDay(catchItem.timeOfDay);
    setLocation(catchItem.location);
    setFjord(catchItem.fjord);
    setBait(catchItem.bait);
    setLengthCm(catchItem.lengthCm);
    setNotes(catchItem.notes);
    setSpotId(catchItem.spotId);
  }
  ```

  With:

  ```ts
  function editCatch(catchItem: Catch) {
    setEditingId(catchItem.id);
    setDate(catchItem.date);
    setTimeOfDay(catchItem.timeOfDay);
    setLocation(catchItem.location);
    setBait(catchItem.bait);
    setLengthCm(catchItem.lengthCm);
    setNotes(catchItem.notes);
    setSpotId(catchItem.spotId);
  }
  ```

- [ ] **Step 5: Update `handleSubmit` — derive fjord at submit boundary**

  Replace:

  ```ts
    const payload = {
      date,
      timeOfDay,
      location,
      fjord,
      bait,
      lengthCm,
      notes,
      spotId,
    };
  ```

  With:

  ```ts
    const payload = {
      date,
      timeOfDay,
      location,
      fjord: deriveFjord(spots, spotId),
      bait,
      lengthCm,
      notes,
      spotId,
    };
  ```

- [ ] **Step 6: Update `applyAiResult` — remove `setFjord`**

  Replace:

  ```ts
  function applyAiResult() {
    if (!aiParsedResult) return;
    setDate(aiParsedResult.date || '');
    setTimeOfDay(aiParsedResult.timeOfDay || '');
    setLocation(aiParsedResult.location || '');
    setFjord(aiParsedResult.fjord || '');
    setBait(aiParsedResult.bait || '');
    setLengthCm(aiParsedResult.lengthCm || null);
    setNotes(aiParsedResult.notes || '');
    setSpotId(aiParsedResult.spotId ?? null);

    setAiParsedResult(null);
    setAiDescription('');
    setShowAiModal(false);
    onToast('Catch suggestion applied to form', 'success');
  }
  ```

  With:

  ```ts
  function applyAiResult() {
    if (!aiParsedResult) return;
    setDate(aiParsedResult.date || '');
    setTimeOfDay(aiParsedResult.timeOfDay || '');
    setLocation(aiParsedResult.location || '');
    setBait(aiParsedResult.bait || '');
    setLengthCm(aiParsedResult.lengthCm || null);
    setNotes(aiParsedResult.notes || '');
    setSpotId(aiParsedResult.spotId ?? null);

    setAiParsedResult(null);
    setAiDescription('');
    setShowAiModal(false);
    onToast('Catch suggestion applied to form', 'success');
  }
  ```

- [ ] **Step 7: Remove `fjord` and `setFjord` from the `<CatchForm>` JSX props**

  Find the `<CatchForm>` element in the JSX. Remove these two prop lines:

  ```tsx
          fjord={fjord}
          setFjord={setFjord}
  ```

  Leave all other `<CatchForm>` props exactly as they are.

---

### 3b — `components/CatchForm.tsx`

- [ ] **Step 8: Remove `fjord` and `setFjord` from `CatchFormProps`**

  Find in the `CatchFormProps` type:

  ```ts
    fjord: string;
    setFjord: (value: string) => void;
  ```

  Delete both lines.

- [ ] **Step 9: Remove `fjord` and `setFjord` from the function signature**

  Find in the destructured parameters of `export default function CatchForm(...)`:

  ```ts
    fjord,
    setFjord,
  ```

  Delete both lines.

- [ ] **Step 10: Remove the Fjord `<input>` block from JSX**

  Find and delete this entire block (label + input, approximately lines 285–298 in the original file):

  ```tsx
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-300">
            Fjord
          </label>

          <input
            type="text"
            value={fjord}
            disabled={isDisabled}
            onChange={(e) => setFjord(e.target.value)}
            placeholder="Fx Roskilde Fjord"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
  ```

- [ ] **Step 11: Remove `currentFjordText` from the `<SpotPicker>` inside `CatchForm`**

  Find in the `<SpotPicker>` element inside `CatchForm`:

  ```tsx
          currentFjordText={fjord}
  ```

  Delete that line. Leave all other `<SpotPicker>` props exactly as they are.

---

### 3c — `components/SpotPicker.tsx`

- [ ] **Step 12: Remove `currentFjordText` from `SpotPickerProps`**

  Find in `SpotPickerProps`:

  ```ts
    currentFjordText: string;
  ```

  Delete that line.

- [ ] **Step 13: Remove `currentFjordText` from destructured parameters**

  Find in the destructured function parameters:

  ```ts
    currentFjordText,
  ```

  Delete that line.

- [ ] **Step 14: Update `handleCreate` to pass `''` instead of `currentFjordText`**

  Replace:

  ```ts
      const newSpot = await onCreateSpot(trimmedLocation, currentFjordText.trim());
  ```

  With:

  ```ts
      const newSpot = await onCreateSpot(trimmedLocation, '');
  ```

---

## Task 4: Run tests and TypeScript check

- [ ] **Step 1: Run the unit tests**

  ```bash
  npm run test:run -- components/CatchesView.test.ts
  ```

  Expected output:
  ```
  ✓ components/CatchesView.test.ts (4)
    ✓ deriveFjord > returns empty string when spotId is null
    ✓ deriveFjord > returns spot bodyOfWater when spot is found
    ✓ deriveFjord > returns empty string when spot has no bodyOfWater
    ✓ deriveFjord > returns empty string when spotId is not in the spots list

  Test Files  1 passed (1)
  Tests       4 passed (4)
  ```

- [ ] **Step 2: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no output (zero errors).

  If errors appear, they will point to remaining references to `fjord`, `setFjord`, or `currentFjordText` that were missed. Fix each one before continuing.

---

## Task 5: Commit

- [ ] **Step 1: Stage all changed files**

  ```bash
  git add components/CatchesView.tsx components/CatchForm.tsx components/SpotPicker.tsx components/CatchesView.test.ts
  ```

- [ ] **Step 2: Commit**

  ```bash
  git commit -m "feat: remove fjord input, derive from spot at submit boundary"
  ```

---

## Task 6: Merge to main

- [ ] **Step 1: Switch to main**

  ```bash
  git checkout main
  ```

- [ ] **Step 2: Merge**

  ```bash
  git merge feature/remove-fjord-input
  ```

  Expected: fast-forward merge, no conflicts.

- [ ] **Step 3: Delete feature branch**

  ```bash
  git branch -d feature/remove-fjord-input
  ```

- [ ] **Step 4: Verify**

  ```bash
  git log --oneline -3
  ```

  Expected: the feature commit at the top of `main`.

---

## Manual Verification Checklist

After merging, start the dev server (`npm run dev`) and open the catch form:

- [ ] The Fjord input is gone — no label, no text field
- [ ] Select a known spot — submit the form — confirm `fjord` in the DB record equals the spot's `bodyOfWater`
- [ ] Clear the spot (select "— Intet sted valgt —") — submit — confirm `fjord` is `''`
- [ ] Click edit on an existing catch — form populates correctly (no fjord error)
- [ ] Type a free-text location with no spot, click "+ Opret nyt sted" — spot is created, form continues normally
- [ ] All other form fields (date, time, location, bait, length, notes) behave exactly as before
