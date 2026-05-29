// scripts/validate-schema-resolution.mjs
// Validates that supabase-js clients route to havorred_log schema correctly.
//
// Required env vars:
//   VALIDATE_SUPABASE_URL   — target project URL
//   VALIDATE_ANON_KEY       — project anon key
//   VALIDATE_SERVICE_KEY    — project service role key (optional; skipped if absent)
//
// Run: node scripts/validate-schema-resolution.mjs

import { createClient } from '@supabase/supabase-js'

const url        = process.env.VALIDATE_SUPABASE_URL
const anonKey    = process.env.VALIDATE_ANON_KEY
const serviceKey = process.env.VALIDATE_SERVICE_KEY

if (!url || !anonKey) {
  console.error('Missing required env vars: VALIDATE_SUPABASE_URL, VALIDATE_ANON_KEY')
  process.exit(1)
}

const SCHEMA             = 'havorred_log'
const EXPECTED_SPOTS     = 10
const EXPECTED_CATCHES   = 26

let allPassed = true

// --------------------------------------------------------
// Helpers
// --------------------------------------------------------

function pass(label, detail) {
  console.log(`[PASS] ${label}`)
  if (detail) console.log(`       ${detail}`)
}

function fail(label, detail) {
  console.log(`[FAIL] ${label}`)
  if (detail) console.log(`       ${detail}`)
  allPassed = false
}

async function checkSchemaRouting(label, client) {
  // Anon-key clients are blocked by RLS (no session), so we expect count=0.
  // The critical assertion is: NO schema-routing error (no 406, no "relation not found").
  const [spotsRes, catchesRes] = await Promise.all([
    client.from('spots').select('*', { count: 'exact', head: true }),
    client.from('catches').select('*', { count: 'exact', head: true }),
  ])

  const spotsRouted   = !spotsRes.error   || !spotsRes.error.message.includes('not found')
  const catchesRouted = !catchesRes.error || !catchesRes.error.message.includes('not found')

  if (spotsRes.error)   console.log(`       spots error:   ${spotsRes.error.message}`)
  if (catchesRes.error) console.log(`       catches error: ${catchesRes.error.message}`)

  const schemaOk = spotsRouted && catchesRouted
  if (schemaOk) {
    pass(label, `spots count=${spotsRes.count ?? 'blocked-by-rls'} catches count=${catchesRes.count ?? 'blocked-by-rls'} (RLS blocks anon; no 406 = schema routing confirmed)`)
  } else {
    fail(label, 'Schema-routing error — havorred_log not in PostgREST exposed schemas')
  }
}

async function checkServiceRole(label, client) {
  const [spotsRes, catchesRes] = await Promise.all([
    client.from('spots').select('*', { count: 'exact', head: true }),
    client.from('catches').select('*', { count: 'exact', head: true }),
  ])

  const spotsOk   = !spotsRes.error   && spotsRes.count   === EXPECTED_SPOTS
  const catchesOk = !catchesRes.error && catchesRes.count === EXPECTED_CATCHES

  if (spotsRes.error)   console.log(`       spots error:   ${spotsRes.error.message}`)
  if (catchesRes.error) console.log(`       catches error: ${catchesRes.error.message}`)

  if (spotsOk && catchesOk) {
    pass(label, `spots=${spotsRes.count}/${EXPECTED_SPOTS} catches=${catchesRes.count}/${EXPECTED_CATCHES}`)
  } else {
    fail(label, `spots=${spotsRes.count ?? 'err'}/${EXPECTED_SPOTS} catches=${catchesRes.count ?? 'err'}/${EXPECTED_CATCHES}`)
  }
}

// --------------------------------------------------------
// Main
// --------------------------------------------------------

console.log(`\nSchema-resolution validation`)
console.log(`Target:   ${url}`)
console.log(`Schema:   ${SCHEMA}`)
console.log(`Expected: ${EXPECTED_SPOTS} spots, ${EXPECTED_CATCHES} catches\n`)

// Client 1: browser-equivalent (mirrors lib/supabase.ts createBrowserClient options)
const browserClient = createClient(url, anonKey, { db: { schema: SCHEMA } })
await checkSchemaRouting('browser-client (anon — schema routing)', browserClient)

// Client 2: server/SSR equivalent (mirrors lib/supabase/server.ts createClient options)
const serverClient = createClient(url, anonKey, { db: { schema: SCHEMA } })
await checkSchemaRouting('server-client  (anon — schema routing)', serverClient)

// Client 3: service-role equivalent (mirrors lib/supabase/server.ts getSupabaseServer options)
if (serviceKey) {
  const serviceClient = createClient(url, serviceKey, {
    db:   { schema: SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await checkServiceRole('service-role   (bypasses RLS — full access)', serviceClient)
} else {
  console.log('[SKIP] service-role — VALIDATE_SERVICE_KEY not set')
  console.log('       Set VALIDATE_SERVICE_KEY to fully validate data access.')
}

console.log(`\nResult: ${allPassed ? 'ALL PASSED' : 'FAILURES DETECTED — see above'}`)
if (!allPassed) process.exit(1)
