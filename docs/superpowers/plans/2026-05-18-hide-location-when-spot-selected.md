# Hide Location Free-Text When Spot Selected Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the free-text Sted input when a Spot is selected so the form shows only the authoritative geographic entity.

**Architecture:** Single conditional render wrap in `CatchForm.tsx`. When `spotId !== null`, the Sted `<div>` is not rendered. No new state, no new props, no new functions. The existing `SpotPicker.onChange` already sets `location` to the spot name on selection, so validation continues to pass when the field is hidden.

**Tech Stack:** React 19, Next.js 16, TypeScript

---

## File Map

| File | Action | What changes |
|---|---|---|
| `components/CatchForm.tsx` | Modify | Wrap Sted `<div>` in `{spotId === null && (...)}` |

No test file changes — this is JSX conditional rendering with no pure function to unit-test. Manual verification checklist is in Task 3.

---

## Task 1: Create feature branch

- [ ] **Step 1: Create and switch to the feature branch**

  ```bash
  git checkout -b s4/hide-location-when-spot-selected
  ```

  Expected: `Switched to a new branch 's4/hide-location-when-spot-selected'`

- [ ] **Step 2: Verify**

  ```bash
  git branch --show-current
  ```

  Expected: `s4/hide-location-when-spot-selected`

---

## Task 2: Apply conditional render

- [ ] **Step 1: Wrap the Sted block in `components/CatchForm.tsx`**

  Find this exact block (search for `Sted (fritekst)`):

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

  Replace with:

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

- [ ] **Step 2: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no output (zero errors).

---

## Task 3: Commit

- [ ] **Step 1: Stage the changed file**

  ```bash
  git add components/CatchForm.tsx
  ```

- [ ] **Step 2: Commit**

  ```bash
  git commit -m "feat: hide free-text location when spot is selected"
  ```

---

## Task 4: Merge to main

- [ ] **Step 1: Switch to main**

  ```bash
  git checkout main
  ```

- [ ] **Step 2: Merge**

  ```bash
  git merge s4/hide-location-when-spot-selected
  ```

  Expected: fast-forward merge, no conflicts.

- [ ] **Step 3: Delete feature branch**

  ```bash
  git branch -d s4/hide-location-when-spot-selected
  ```

- [ ] **Step 4: Verify**

  ```bash
  git log --oneline -3
  ```

  Expected: the feature commit at the top of `main`.

---

## Manual Verification Checklist

After merging, start the dev server (`npm run dev`) and open the catch form:

- [ ] No spot selected — Sted (fritekst) field is visible and editable
- [ ] Select a spot from the SpotPicker — Sted field disappears immediately
- [ ] Clear the spot ("— Intet sted valgt —") — Sted field reappears
- [ ] Submit a catch with a spot selected — succeeds, no location validation error
- [ ] Submit a catch with no spot and no location text — validation error appears on Sted field as usual
- [ ] All other form fields (date, time, bait, length, notes) behave exactly as before
