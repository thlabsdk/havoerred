// app/login/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { LoginForm } from './LoginForm'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/')

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-slate-800 p-8">
        <div className="mb-8">
          <p className="text-xs font-mono text-slate-500 mb-1">havørredloggen</p>
          <p className="text-sm font-mono text-slate-400">
            Enter your email to receive a magic link.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
