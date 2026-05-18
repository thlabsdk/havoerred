# 003 — Separate Runtime Boundary

## Context

STL was initially developed inside the THLabs ecosystem. As the product scope became
clearer — an independent operational system for a specific domain — continuing to
share runtime, auth, and deployment with the THLabs platform introduced unnecessary
coupling and deployment friction.

## Decision

Deploy STL as an entirely separate application:

- Independent deployment at `trout.thlabs.dk`
- Own Supabase project (separate DB, separate auth, separate service keys)
- Own environment variables and deployment pipeline
- No shared state or API calls with the THLabs platform at runtime

The THLabs registry integration (project detail page + external project handoff) is a
one-way integration for discoverability, not a shared runtime dependency.

## Consequences

- STL deploys and operates independently — no coordination required with THLabs
  deployment for STL changes.
- Auth, data, and operational concerns are fully isolated.
- Any future integration with THLabs platform is opt-in and bounded.
- No shared session, shared DB, or shared API surface.
