import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  ArrowUpRight,
  Banknote,
  ChevronRight,
  Headphones,
  History,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { AppShell } from '@/components/AppShell'
import { AuthGate } from '@/components/AuthGate'
import { formatCurrency, statusLabel } from '@/lib/format'
import { getAccountOverview, type AccountOverview } from '@/server/accounts'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <AppShell>
      <AuthGate>
        <DashboardContent />
      </AuthGate>
    </AppShell>
  )
}

function DashboardContent() {
  const loadOverview = useServerFn(getAccountOverview)
  const [overview, setOverview] = useState<AccountOverview | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOverview()
      .then(setOverview)
      .catch(() => setError('Account data could not be loaded.'))
  }, [loadOverview])

  if (error) {
    return <ErrorPanel message={error} />
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <BalanceCard overview={overview} />
      <div className="mt-6 grid gap-3">
        <ActionTile
          to="/withdrawals"
          icon={ArrowUpRight}
          title="Withdrawal"
          subtitle="Send funds to a payment app, bank, or wallet"
          accent="bg-[#d96f32]"
        />
        <ActionTile
          to="/transactions"
          icon={History}
          title="Transaction history"
          subtitle="Review every deposit and withdrawal"
          accent="bg-[#256352]"
        />
        <ActionTile
          to="/support"
          icon={Headphones}
          title="Chat support"
          subtitle="Message a representative about the account"
          accent="bg-[#23342d]"
        />
      </div>
    </div>
  )
}

function BalanceCard({ overview }: { overview: AccountOverview | null }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#23342d] via-[#1f4a3d] to-[#256352] p-6 text-[#f7f3ea] shadow-xl shadow-[#1f2520]/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8c7ae]">
            Live available balance
          </p>
          <p className="mt-3 text-5xl font-semibold tracking-tight">
            {overview ? formatCurrency(overview.profile.availableBalanceCents) : '—'}
          </p>
        </div>
        <span className="grid size-12 place-items-center rounded-full bg-white/10">
          <Banknote className="size-6" />
        </span>
      </div>
      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2 text-[#ecdfca]">
          <ShieldCheck className="size-4" />
          Verification:{' '}
          <span className="font-semibold text-white">
            {overview ? statusLabel(overview.profile.verificationStatus) : '—'}
          </span>
        </span>
      </div>
    </section>
  )
}

function ActionTile({
  to,
  icon: Icon,
  title,
  subtitle,
  accent,
}: {
  to: string
  icon: typeof ArrowUpRight
  title: string
  subtitle: string
  accent: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-xl border border-[#d8d0c1] bg-[#fffdf8] p-5 shadow-sm transition hover:border-[#bd5b2a] hover:shadow-md"
    >
      <span className={`grid size-12 place-items-center rounded-full text-white ${accent}`}>
        <Icon className="size-5" />
      </span>
      <div className="flex-1">
        <p className="text-base font-semibold text-[#1f2520]">{title}</p>
        <p className="mt-0.5 text-sm leading-5 text-[#6f5f4d]">{subtitle}</p>
      </div>
      <ChevronRight className="size-5 text-[#9a8975] transition group-hover:translate-x-0.5 group-hover:text-[#bd5b2a]" />
    </Link>
  )
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md rounded-md border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-900">
      {message}
    </div>
  )
}
