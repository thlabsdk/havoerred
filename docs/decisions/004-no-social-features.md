# 004 — No Social Features

## Context

Fishing apps frequently add social layers: sharing catches, following other anglers,
leaderboards, public spot pages. These features are high-complexity, require
multi-user data modeling, and change the product from a personal operational record
into a social platform.

## Decision

STL is a single-user operational system. No social or collaborative features will be
added.

Specifically excluded:
- Public catch sharing or profiles
- Multi-user spot access
- Social feeds or activity streams
- Leaderboards or competition features
- Team or group accounts
- Comments or reactions

The `owner_user_id` column on `spots` is reserved for per-user scoping of the spot
registry, not multi-user sharing.

## Consequences

- Auth model stays simple: one user per session, no authorization tiers.
- Data model stays clean: `owner_user_id` scoping is sufficient for single-user isolation.
- No need for sharing permissions, visibility controls, or relationship tables.
- Future multi-user support (if ever required) would be scoped to isolation, not sharing.
