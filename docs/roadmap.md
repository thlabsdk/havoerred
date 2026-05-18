# Sea Trout Log — Roadmap

*Last updated after Sprint 4 completion.*

---

# Current Product Direction

Sea Trout Log is evolving toward:

> a structured field intelligence system for sea trout fishing

—not a social fishing app, not a dashboard product, and not primarily a map application.

The core priority is now:

* fast field capture
* low-friction logging
* structured operational data
* reliable enrichment
* mobile-first ergonomics
* entity-driven metadata

The system is intentionally becoming:

* more structured
* less form-heavy
* less redundant
* more operational

Deployment, auth, and runtime separation are now considered stable foundations.

---

# Completed Milestones

## Platform & Infrastructure

* Next.js 16 application scaffolded
* Supabase integrated
* Separate STL deployment established at `trout.thlabs.dk`
* SSR auth implemented using `@supabase/ssr`
* Middleware-based auth gate
* Magic-link authentication flow
* Custom SMTP configured and operational
* Separate runtime from THLabs platform proven
* THLabs registry integration completed
* Project detail page + external project handoff working

---

## Catch System Foundations

* `catches` table created and mapped to frontend models
* Basic catch CRUD workflows implemented
* JSON import/export pipeline implemented
* OpenAI parse route + AI parsing flow implemented

### AI parsing hardening

* `response_format: json_object`
* deterministic parse behavior
* `undersized` coercion
* `lengthCm` coercion
* date validation
* configurable parse model
* debug logging gates
* schema normalization improvements

---

## Spot Registry System

* `spots` table implemented
* canonical spot names
* aliases
* body of water metadata
* lat/lng support
* owner support
* `catches.spot_id` foreign key
* SpotPicker UI
* inline spot creation flow
* AI spot matching against user spots
* hallucinated ID defense
* spot mapper + schema test coverage

---

## Enrichment Pipeline

### Weather enrichment

Via Open-Meteo:

* wind speed
* air temperature
* weather code
* weather metadata persistence

### Water enrichment

Via Open-Meteo Marine:

* sea-level lookup
* water trend derivation
* tide phase derivation

### Pipeline behavior

* parallel provider execution
* partial-success persistence
* fault injection support
* enrichment idempotency
* async enrichment trigger after insert

---

# UI Architecture Refactor (completed)

The application architecture was simplified into domain-oriented views.

## Current structure

Tabs:

* Fangster
* Bulk
* Steder

`app/page.tsx` now acts primarily as:

* coordinator
* state owner
* callback dispatcher

UI domains split into:

* `CatchesView`
* `BulkOpsView`
* `SpotsView`

Spot management includes:

* CRUD
* aliases
* import/export
* modal editing
* tolerant validation/import architecture

---

# Sprint 4 — Capture Flow & Field UX (completed)

Sprint 4 intentionally avoided:

* dashboard work
* analytics work
* map redesign
* large UI rewrites

The focus was entirely:

> reducing field friction during real-world mobile catch logging.

## Task 1 — Date Input Auto-Formatting

Users can now type:

12052026

and the field formats live into:

12/05/2026

Implemented with:

* lightweight inline formatting
* numeric mobile keyboard
* tolerant paste normalization
* no masking library

---

## Task 2 — Fjord Input Removal

The manual Fjord field was removed.

`fjord` is now derived automatically from the selected Spot's `bodyOfWater`.

Key architectural shift:

> structured metadata derives from structured entities.

Results:

* fewer fields
* less duplication
* stronger geo model
* less inconsistent data

---

## Task 3 — Length Input Mobile Optimization

The length field now uses:

`type="text" + inputMode="numeric"`

instead of `type="number"`.

Benefits:

* cleaner mobile keyboard
* fewer accidental characters
* normalization-based parsing
* integer-only operational flow

---

## Task 4 — Conditional Location Field Visibility

The free-text `Sted` field is now hidden whenever a structured Spot is selected.

This reinforces:

* Spot as authoritative geo entity
* dual capture modes
* lower visual noise
* faster structured logging

No synchronization or hidden derived state was introduced.

---

# Current Product Understanding

A major product insight emerged during Sprint 4:

> STL is primarily a field capture system.

Not:

* a dashboard product
* a map-first product
* a social fishing app

The future value of the platform depends primarily on:

* capture speed
* capture consistency
* structured entities
* enrichment quality
* operational usability in the field

This now guides roadmap prioritization.

---

# Immediate Next Phase

## Operational Usage & Observation

Before major redesign work:

* use the app actively in real fishing sessions
* identify friction from actual field use
* observe where logging still feels slow or mentally heavy
* validate whether the current capture flow is "fast enough"

The next wave of improvements should come primarily from:

* real usage
* repeated field sessions
* operational irritation points

—not speculative redesign.

---

# Operational Stabilization Priorities

As the system transitions from prototype-phase into operational usage, the next
priorities are focused on robustness, consistency, and explicit system
boundaries rather than large feature expansion.

## Current operational focus areas

### Enrichment reliability

The enrichment pipeline is currently frontend-triggered after insert.

This architecture is intentionally simple and operationally lightweight, but it
introduces a known risk:

> if the frontend enrichment trigger fails silently, enrichment does not run.

Current priorities:

* observe enrichment reliability during real-world use
* improve visibility into skipped/failed enrichments
* evaluate whether retry behavior is needed
* avoid introducing queue complexity prematurely

### Auth vs database boundary

Authentication is operational, but owner-scoped RLS policies are not yet
enabled.

This is currently acceptable during the single-user operational phase, but is
now considered explicit technical debt rather than a future abstraction.

### Transitional schema areas

Some schema decisions are now transitional rather than foundational.

Most notably:

* `catches.date` still stored as TEXT
* analytics views now perform date parsing/coercion
* long-term migration toward typed DATE fields is expected

Migration timing remains intentionally deferred until operational usage patterns
stabilize further.

### Middleware/runtime verification

The auth gate currently compiles successfully but the runtime wiring should be
explicitly verified to ensure middleware/proxy behavior matches current
Next.js conventions.

---

# Upcoming Directions

These are now considered likely future directions, but not all are immediate sprint candidates.

---

# Future Direction A — Data Access & Queryability

The product direction is shifting away from map-first visualization.

Primary future retrieval model is expected to become:

* dense catch tables
* filtering
* search
* correlation workflows
* operational browsing

Likely future capabilities:

* searchable catch table
* filtering by:
  * spot
  * bait
  * tide phase
  * wind
  * date range
  * undersized

* saved query views
* SQL-oriented analytics foundation

Important:

Maps are now viewed as:

> exploratory tooling

—not the application's primary interface.

---

# Future Direction B — Conversational Capture

One of the strongest future directions identified so far:

> conversational logging through ChatGPT.

Example:

Fangede en havørred ved Kyndby kl 21.
Bombarda med Guldbassen.
Under mål.

Potential flow:

ChatGPT
→ structured ingestion endpoint
→ STL validation pipeline
→ enrichment pipeline
→ persisted catch

Important architectural principle:

> ChatGPT should be a capture interface — not the system of record.

STL continues to own:

* validation
* storage
* enrichment
* history
* identity

This is considered a likely major future milestone.

---

# Deferred / Not Current Priorities

The following are intentionally NOT current focus areas:

* dashboard systems
* chart-heavy analytics
* social features
* notifications
* collaboration/team systems
* native app
* aggressive redesign work
* complex state-management systems
* large admin frameworks

---

# Potential Future Features

## Medium-term

* bait registry
* image upload flow
* image-assisted catch parsing
* richer spot management
* URL-synced filtering
* operational catch tables

## Longer-term

* "Ask your log" / RAG over catch history
* AI-assisted trend detection
* advanced environmental correlations
* field-photo ingestion workflows

---

# Engineering Principles (current)

The project is currently following these principles intentionally:

* small scoped feature branches
* one operational improvement at a time
* minimal abstraction
* normalize instead of block
* entity-owned metadata
* derive structured data instead of manually entering it
* mobile-first field ergonomics
* avoid architecture churn without clear operational need

---

# Current Status

## Platform

Operational and actively used.

## Deployment

Separate STL runtime operational at `trout.thlabs.dk`.

## Auth

Operational SSR auth with middleware gating and magic-link flow.

## Enrichment

Operational with partial-success persistence and fault isolation.

## Capture UX

Significantly improved after Sprint 4.

## Product Direction

Increasingly clear and coherent.

## Known Operational Debt

* RLS not yet enabled
* enrichment pipeline frontend-triggered
* transitional TEXT date storage
* middleware/proxy verification pending
