import { useNavigate } from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'

import { useIdentity } from '@/lib/identity-context'

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: '/login' })
    }
  }, [navigate, ready, user])

  if (!ready || !user) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="h-24 w-[min(90vw,520px)] animate-pulse rounded-md bg-white/70" />
      </div>
    )
  }

  return <>{children}</>
}
