// lib/supabase/server.ts
import { createClient as createSupabaseServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

let cached: SupabaseClient<any, 'havorred_log'> | null = null

export function getSupabaseServer(): SupabaseClient<any, 'havorred_log'> {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (required for server-side writes)')
  }

  cached = createSupabaseServiceClient(url, serviceKey, {
    db: { schema: 'havorred_log' },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

// Use this in Server Components, Route Handlers, and middleware.
// Must be awaited — cookies() is async in Next.js 16.
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'havorred_log' },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Expected in Server Component render — safe to ignore.
        }
      },
    },
  })
}
