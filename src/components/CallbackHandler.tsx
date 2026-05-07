import { useEffect, useState, type ReactNode } from 'react'
import { handleAuthCallback } from '@netlify/identity'

const AUTH_HASH_PATTERN =
  /^#(confirmation_token|recovery_token|invite_token|email_change_token|access_token)=/

export function CallbackHandler({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!AUTH_HASH_PATTERN.test(window.location.hash)) return

    handleAuthCallback()
      .then((result) => {
        if (!result) return
        if (result.type === 'confirmation') {
          setMessage('Email confirmed. The account is ready to use.')
        }
        if (result.type === 'recovery') {
          setMessage('Password recovery was confirmed. Set a new password from account settings.')
        }
      })
      .catch(() => {
        setMessage('The account link could not be verified. Request a new link and try again.')
      })
  }, [])

  return (
    <>
      {message ? (
        <div className="fixed left-1/2 top-4 z-50 w-[min(92vw,520px)] -translate-x-1/2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 shadow-lg">
          {message}
        </div>
      ) : null}
      {children}
    </>
  )
}
