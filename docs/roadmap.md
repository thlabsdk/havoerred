# Roadmap

## Completed milestones

- Next.js 16 application scaffolded
- Supabase client integrated
- `catches` table created and mapped to frontend models
- JSON import pipeline implemented
- Basic catch CRUD workflows available
- OpenAI parse route and AI parsing flow added
- Observability improvements for AI parsing and API errors

## Current AI parsing work

- Improving frontend and backend error visibility
- Logging request payloads, OpenAI responses, and validation failures
- Returning structured errors instead of empty objects
- Ensuring `OPENAI_API_KEY` is checked and surfaced clearly

## Upcoming features

- Enrichment pipeline for catch metadata
- User authentication and role-based access
- Analytics dashboards for catch trends
- Map-based catch visualization
- AI-assisted catch enrichment and suggestion tools

## Planned enrichment pipeline

- Add a secondary parse or classification step for catch details
- Enhance catches with weather, location, and bait context
- Store enrichment flags or augmented metadata in the database

## Auth

- Add user sign-in through Supabase Auth or a custom auth layer
- Enable per-user catch history and access controls
- Protect import and AI parsing routes behind authentication

## Analytics

- Build usage and catch metrics
- Track catch counts, undersized ratios, location popularity, and bait success
- Add charts or reports in the admin UI

## Maps

- Add geolocation or map pinning for catch locations
- Show catches on an interactive map view
- Support location-based filtering and region summaries

## AI-assisted catch enrichment

- Use AI to suggest missing fields, clean descriptions, or classify conditions
- Integrate enrichment into the import workflow
- Add a review step for AI-suggested values before saving
