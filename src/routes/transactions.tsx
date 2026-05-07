import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ArrowDownRight, ArrowUpRight, ReceiptText } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AppShell, PageHeader } from '@/components/AppShell'
import { AuthGate } from '@/components/AuthGate'
import { formatCurrency, formatDate, statusLabel } from '@/lib/format'
import { getAccountOverview, type AccountOverview } from '@/server/accounts'

export const Route = createFileRoute('/transactions')({
  component: TransactionsPage,
})

function TransactionsPage() {
  return (
    <AppShell>
      <AuthGate>
        <TransactionsContent />
      </AuthGate>
    </AppShell>
  )
}

function TransactionsContent() {
  const loadOverview = useServerFn(getAccountOverview)
  const [overview, setOverview] = useState<AccountOverview | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOverview().then(setOverview).catch(() => {
      setError('Transaction history could not be loaded.')
    })
  }, [loadOverview])

  return (
    <>
      <PageHeader
        eyebrow="Transaction history"
        title="Deposits, credits, withdrawals, and status updates"
        description="Review every account credit and withdrawal request with method, token, status, and processing notes."
      />

      <section className="rounded-md border border-[#d8d0c1] bg-[#fffdf8] shadow-sm">
        {error ? (
          <p className="p-5 text-sm font-medium text-red-900">{error}</p>
        ) : !overview ? (
          <div className="h-72 animate-pulse rounded-md bg-white/70" />
        ) : overview.transactions.length ? (
          <div className="divide-y divide-[#ebe2d4]">
            {overview.transactions.map((transaction) => (
              <article
                key={transaction.id}
                className="grid gap-4 p-5 md:grid-cols-[1fr_180px_180px]"
              >
                <div className="flex gap-3">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-md ${transaction.type === 'credit' ? 'bg-[#e2eee7] text-[#256352]' : 'bg-[#f7dfcf] text-[#bd5b2a]'}`}>
                    {transaction.type === 'credit' ? (
                      <ArrowUpRight className="size-5" />
                    ) : (
                      <ArrowDownRight className="size-5" />
                    )}
                  </span>
                  <div>
                    <p className="font-semibold">{transaction.method}</p>
                    <p className="mt-1 text-sm leading-6 text-[#5f665f]">
                      {transaction.note ?? 'No processing note added.'}
                    </p>
                    {transaction.destination ? (
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#9a8975]">
                        Destination saved
                      </p>
                    ) : null}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a8975]">
                    Status
                  </p>
                  <p className="mt-1 font-semibold">{statusLabel(transaction.status)}</p>
                  <p className="mt-1 text-sm text-[#6f5f4d]">{formatDate(transaction.createdAt)}</p>
                </div>
                <div className="md:text-right">
                  <p className={transaction.type === 'credit' ? 'text-xl font-semibold text-[#256352]' : 'text-xl font-semibold text-[#bd5b2a]'}>
                    {transaction.type === 'credit' ? '+' : '-'}
                    {formatCurrency(transaction.amountCents)}
                  </p>
                  {transaction.feeCents ? (
                    <p className="mt-1 text-sm text-[#6f5f4d]">
                      Token {formatCurrency(transaction.feeCents)}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <ReceiptText className="mx-auto size-10 text-[#bd5b2a]" />
              <h2 className="mt-4 text-xl font-semibold">No transaction records</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#5f665f]">
                Deposits and account credits will appear here after an administrator funds the account.
              </p>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
