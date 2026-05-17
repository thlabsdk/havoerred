// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

// Use this in Client Components ("use client"). Do not import in server code.
// createBrowserClient reads and writes auth tokens via document.cookie.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
