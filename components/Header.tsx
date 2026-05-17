// components/Header.tsx
import { LogoutButton } from './LogoutButton'

interface HeaderProps {
  userEmail: string | null
}

export function Header({ userEmail }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 px-6 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono text-slate-300">
          havørredloggen
        </span>

        {userEmail && (
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-500">
              {userEmail}
            </span>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  )
}
