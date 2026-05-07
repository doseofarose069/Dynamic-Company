import { Link, useNavigate } from '@tanstack/react-router'
import {
  Banknote,
  CircleDollarSign,
  Headphones,
  History,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'
import { type ReactNode } from 'react'

import { useIdentity } from '@/lib/identity-context'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/withdrawals', label: 'Withdraw', icon: Banknote },
  { to: '/transactions', label: 'History', icon: History },
  { to: '/support', label: 'Support', icon: Headphones },
] as const

export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useIdentity()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1f2520]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(189,91,42,0.16),transparent_28%),radial-gradient(circle_at_85%_12%,rgba(37,99,82,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(244,241,234,0.9))]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-[#d8d0c1] bg-[#23342d] px-4 py-4 text-[#f7f3ea] lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link to="/" className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-md bg-[#d96f32]">
                <CircleDollarSign className="size-6" />
              </span>
              <span>
                <span className="block text-lg font-semibold tracking-wide">
                  Payout Ledger
                </span>
                <span className="block text-xs uppercase tracking-[0.18em] text-[#d8c7ae]">
                  Credits and withdrawals
                </span>
              </span>
            </Link>
            {ready && user ? (
              <button
                className="inline-flex size-10 items-center justify-center rounded-md border border-white/20 text-[#f7f3ea] transition hover:bg-white/10 lg:hidden"
                onClick={handleLogout}
                aria-label="Log out"
              >
                <LogOut className="size-4" />
              </button>
            ) : null}
          </div>

          <nav className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-[#ecdfca] transition hover:bg-white/10 [&.active]:bg-[#f4f1ea] [&.active]:text-[#23342d]"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {ready && user ? (
            <div className="mt-6 hidden border-t border-white/15 pt-4 text-sm lg:block">
              <p className="text-[#d8c7ae]">Signed in as</p>
              <p className="truncate font-semibold">{user.email}</p>
              <button
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm font-medium transition hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          ) : null}
        </aside>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <header className="mb-6 max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#bd5b2a]">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-[#1f2520] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-base leading-7 text-[#5f665f]">{description}</p>
    </header>
  )
}
