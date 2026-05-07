import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ArrowLeft, BadgeDollarSign, Calculator, Info } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { AppShell, PageHeader } from '@/components/AppShell'
import { AuthGate } from '@/components/AuthGate'
import { formatCurrency } from '@/lib/format'
import { getAccountOverview, type AccountOverview } from '@/server/accounts'

type FeeSearch = {
  amount?: number
}

export const Route = createFileRoute('/fees')({
  component: FeesPage,
  validateSearch: (search: Record<string, unknown>): FeeSearch => {
    const raw = search.amount
    const parsed = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : undefined
    return {
      amount: parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined,
    }
  },
})

function FeesPage() {
  return (
    <AppShell>
      <AuthGate>
        <FeesContent />
      </AuthGate>
    </AppShell>
  )
}

function FeesContent() {
  const { amount } = useSearch({ from: '/fees' })
  const loadOverview = useServerFn(getAccountOverview)
  const [overview, setOverview] = useState<AccountOverview | null>(null)

  useEffect(() => {
    loadOverview().then(setOverview).catch(() => undefined)
  }, [loadOverview])

  const isFirstWithdrawal = useMemo(() => {
    return !overview?.transactions.some((transaction) => transaction.type === 'withdrawal')
  }, [overview])

  const amountCents = amount && Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0
  const feeCents = isFirstWithdrawal ? Math.ceil(amountCents * 0.008) : 0

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        to="/withdrawals"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#256352] hover:text-[#1a3f33]"
      >
        <ArrowLeft className="size-4" />
        Back to withdrawal request
      </Link>

      <PageHeader
        eyebrow="Token breakdown"
        title="How the withdrawal amount is calculated"
        description="Every withdrawal shows the requested amount and any applicable processing token. Only the withdrawal amount is taken from the available balance — the token is paid separately from an external bank."
      />

      <section className="rounded-md border border-[#d8d0c1] bg-[#23342d] p-6 text-[#f7f3ea] shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-md bg-[#d96f32]">
            <BadgeDollarSign className="size-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8c7ae]">
              Requested withdrawal
            </p>
            <p className="text-3xl font-semibold">{formatCurrency(amountCents)}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <Line label="Withdrawal amount (deducted from balance)" value={formatCurrency(amountCents)} strong />
          <Line
            label={isFirstWithdrawal ? 'First-time withdrawal token (0.8%, paid externally)' : 'Processing token'}
            value={formatCurrency(feeCents)}
          />
        </div>
      </section>

      <section className="mt-5 rounded-md border border-[#d8d0c1] bg-[#fffdf8] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-[#ecdfca] text-[#256352]">
            <Calculator className="size-5" />
          </span>
          <h2 className="text-lg font-semibold">When the token applies</h2>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[#5f665f]">
          <li className="flex gap-3">
            <Info className="mt-1 size-4 shrink-0 text-[#bd5b2a]" />
            The first withdrawal on an account includes a 0.8% processing token. The token covers
            verification, anti-fraud checks, and the rails used to deliver funds.
          </li>
          <li className="flex gap-3">
            <Info className="mt-1 size-4 shrink-0 text-[#bd5b2a]" />
            Only the withdrawal amount is deducted from the available balance when the request is
            submitted. The token is paid separately from an external bank to the disclosed BTC
            forwarding address. The withdrawal amount is refunded if the request is rejected or
            canceled.
          </li>
          <li className="flex gap-3">
            <Info className="mt-1 size-4 shrink-0 text-[#bd5b2a]" />
            Subsequent withdrawals on a verified account are processed without the first-time token
            unless additional review is required.
          </li>
        </ul>
      </section>
    </div>
  )
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        strong ? 'border-t border-white/20 pt-3 font-semibold' : ''
      }`}
    >
      <span className="text-[#d8c7ae]">{label}</span>
      <span>{value}</span>
    </div>
  )
}
