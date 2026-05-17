// components/LogoutButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-mono text-slate-300 hover:text-white transition-colors"
    >
      logout
    </button>
  )
}
