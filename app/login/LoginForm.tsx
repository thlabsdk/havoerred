// app/login/LoginForm.tsx
'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <p className="text-sm font-mono text-slate-400">
        Check your email for a magic link.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-xs font-mono text-slate-500 uppercase tracking-wider">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="bg-slate-900 border border-slate-700 text-sm font-mono text-white px-3 py-2 focus:outline-none focus:border-slate-500"
        />
      </div>

      {error && (
        <p className="text-xs font-mono text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="text-xs font-mono text-slate-300 border border-slate-700 px-4 py-2 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start"
      >
        {loading ? 'Sending…' : 'Send magic link'}
      </button>
    </form>
  )
}
