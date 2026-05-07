import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AuthError, login, requestPasswordRecovery, signup } from '@netlify/identity'
import { Mail, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useIdentity } from '@/lib/identity-context'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { user, ready } = useIdentity()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (ready && user) {
      navigate({ to: '/' })
    }
  }, [navigate, ready, user])

  const handleError = (error: unknown) => {
    if (error instanceof AuthError) {
      setStatus(error.status === 401 ? 'Invalid email or password.' : error.message)
      return
    }
    setStatus('The account request could not be completed.')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      if (mode === 'signup') {
        await signup(email, password, { full_name: name })
        setStatus('Registration started. Check email to confirm the account before logging in.')
      } else {
        await login(email, password)
        navigate({ to: '/' })
      }
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const recoverPassword = async () => {
    if (!email) {
      setStatus('Enter the account email before requesting password recovery.')
      return
    }

    setLoading(true)
    try {
      await requestPasswordRecovery(email)
      setStatus('Password recovery email sent.')
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#23342d] px-4 py-10 text-[#1f2520]">
      <form
        className="w-full max-w-md rounded-md border border-white/15 bg-white p-6 shadow-2xl sm:p-8"
        onSubmit={handleSubmit}
      >
        <div className="mb-6 flex rounded-md bg-[#f4f1ea] p-1">
          <button
            type="button"
            className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-[#23342d] text-white' : 'text-[#5f665f]'}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 rounded px-3 py-2 text-sm font-semibold ${mode === 'signup' ? 'bg-[#23342d] text-white' : 'text-[#5f665f]'}`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        {mode === 'signup' ? (
          <label className="mb-4 block">
            <span className="text-sm font-semibold">Full name</span>
            <input
              className="mt-2 w-full rounded-md border border-[#d8d0c1] bg-[#fbfaf7] px-3 py-3 outline-none focus:border-[#256352]"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
        ) : null}

        <label className="mb-4 block">
          <span className="text-sm font-semibold">Email</span>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6f5f4d]" />
            <input
              className="w-full rounded-md border border-[#d8d0c1] bg-[#fbfaf7] py-3 pl-10 pr-3 outline-none focus:border-[#256352]"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </label>

        <label className="mb-5 block">
          <span className="text-sm font-semibold">Password</span>
          <input
            className="mt-2 w-full rounded-md border border-[#d8d0c1] bg-[#fbfaf7] px-3 py-3 outline-none focus:border-[#256352]"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        {status ? (
          <p className="mb-4 rounded-md border border-[#d8d0c1] bg-[#f4f1ea] px-3 py-2 text-sm text-[#5f3c25]">
            {status}
          </p>
        ) : null}

        <button
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#d96f32] px-4 py-3 font-semibold text-white transition hover:bg-[#bd5b2a] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          <UserPlus className="size-4" />
          {loading ? 'Processing' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>

        <button
          type="button"
          className="mt-4 w-full text-sm font-semibold text-[#256352]"
          onClick={recoverPassword}
          disabled={loading}
        >
          Send password recovery email
        </button>
      </form>
    </div>
  )
}
