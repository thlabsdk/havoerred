# Debugging

## Common issues encountered so far

- Missing environment variables prevents Supabase or OpenAI from initializing.
- OpenAI responses may not be valid JSON, causing parse failures.
- Supabase inserts can fail if imported data does not match the expected shape.
- Hydration issues can appear if client-only state is not guarded.

## Hydration issues

- `app/page.tsx` uses client-side state and `useEffect` to load catches.
- Keep `hydrated` or equivalent flags in place when mixing server-rendered markup and client-only behavior.
- Avoid reading browser-only values during initial render.

## Supabase setup issues

- Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`.
- Ensure the `catches` table exists with the expected columns.
- Watch for permission issues if Supabase policies are restrictive.

## OpenAI API setup

- `OPENAI_API_KEY` must be defined in the server environment.
- The API route should use server-only env variables for OpenAI credentials.
- If model names change, update `app/api/parse-catch/route.ts` accordingly.
- The current model is `gpt-4o-mini`.

## environment variables

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

Best practice:
- Keep server-only secrets out of client bundles.
- Use `NEXT_PUBLIC_*` only for values safe to expose in the browser.

## migration workflow

- Maintain SQL migration files under `supabase/migrations/`.
- Update the schema with a new migration rather than editing old files.
- Run Supabase migration tooling to apply schema changes consistently.

## AI parsing debugging strategy

- Log the incoming request body in `app/api/parse-catch/route.ts`.
- Log the OpenAI request payload before sending it.
- Log the raw OpenAI response and extracted text.
- Attempt JSON parsing and log parse failures explicitly.
- Validate the parsed object with Zod and log validation issues.
- Return structured error responses to the frontend with `error` and `details`.
- On the frontend, log `response.status`, `response.statusText`, and the response body safely.
- Avoid generic empty object error output by preserving message details.
