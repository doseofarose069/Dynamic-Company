import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getUser,
  logout as identityLogout,
  onAuthChange,
  type User,
} from '@netlify/identity'

type IdentityContextValue = {
  user: User | null
  ready: boolean
  logout: () => Promise<void>
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    getUser().then((currentUser) => {
      if (!active) return
      setUser(currentUser)
      setReady(true)
    })

    const unsubscribe = onAuthChange((_event, currentUser) => {
      setUser(currentUser)
      setReady(true)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      logout: identityLogout,
    }),
    [user, ready],
  )

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity() {
  const context = useContext(IdentityContext)

  if (!context) {
    throw new Error('useIdentity must be used inside IdentityProvider')
  }

  return context
}
