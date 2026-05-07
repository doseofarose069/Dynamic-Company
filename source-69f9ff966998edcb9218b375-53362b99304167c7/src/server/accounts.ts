import { createServerFn } from '@tanstack/react-start'
import { getUser, type User } from '@netlify/identity'
import { getDatabase } from '@netlify/database'

export type AccountProfile = {
  userId: string
  email: string
  displayName: string | null
  verificationStatus: string
  accountStatus: string
  availableBalanceCents: number
  lifetimeCreditedCents: number
  lifetimeWithdrawnCents: number
  createdAt: string
  updatedAt: string
}

export type TransactionRecord = {
  id: string
  userId: string
  type: 'credit' | 'withdrawal'
  method: string
  destination: string | null
  accountReference: string | null
  amountCents: number
  feeCents: number
  status: string
  note: string | null
  createdAt: string
  updatedAt: string
}

export type ActivityRecord = {
  id: string
  userId: string
  title: string
  detail: string
  createdAt: string
}

export type AccountOverview = {
  profile: AccountProfile
  transactions: TransactionRecord[]
  activity: ActivityRecord[]
}

const withdrawalMethods = new Set([
  'Cash App',
  'Zelle',
  'PayPal',
  'Venmo',
  'BTC',
  'USDT',
  'ETH',
])

function mapProfile(row: Record<string, unknown>): AccountProfile {
  return {
    userId: String(row.user_id),
    email: String(row.email),
    displayName: row.display_name ? String(row.display_name) : null,
    verificationStatus: String(row.verification_status),
    accountStatus: String(row.account_status),
    availableBalanceCents: Number(row.available_balance_cents),
    lifetimeCreditedCents: Number(row.lifetime_credited_cents),
    lifetimeWithdrawnCents: Number(row.lifetime_withdrawn_cents),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapTransaction(row: Record<string, unknown>): TransactionRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: String(row.type) === 'credit' ? 'credit' : 'withdrawal',
    method: String(row.method),
    destination: row.destination ? String(row.destination) : null,
    accountReference: row.account_reference ? String(row.account_reference) : null,
    amountCents: Number(row.amount_cents),
    feeCents: Number(row.fee_cents),
    status: String(row.status),
    note: row.note ? String(row.note) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapActivity(row: Record<string, unknown>): ActivityRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    detail: String(row.detail),
    createdAt: String(row.created_at),
  }
}

function amountToCents(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Enter a withdrawal amount greater than zero.')
  }

  const cents = Math.round(amount * 100)

  if (cents < 250000) {
    throw new Error('Minimum withdrawal amount is $2,500.')
  }

  return cents
}

async function requireIdentityUser() {
  const user = await getUser()

  if (!user?.id) {
    throw new Error('Authentication required')
  }

  return user
}

async function ensureProfile(user: User) {
  const database = getDatabase()
  const email = user.email ?? 'unknown@example.com'
  const displayName = user.name ?? null
  const rows = (await database.sql`
    INSERT INTO account_profiles (user_id, email, display_name)
    VALUES (${user.id}, ${email}, ${displayName})
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, account_profiles.display_name),
      updated_at = NOW()
    RETURNING *
  `) as Array<Record<string, unknown>>

  return mapProfile(rows[0])
}

async function loadOverview(user: User): Promise<AccountOverview> {
  const database = getDatabase()
  const profile = await ensureProfile(user)
  const transactionRows = (await database.sql`
    SELECT * FROM transaction_records
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 12
  `) as Array<Record<string, unknown>>
  const activityRows = (await database.sql`
    SELECT * FROM account_activity
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
    LIMIT 10
  `) as Array<Record<string, unknown>>

  return {
    profile,
    transactions: transactionRows.map(mapTransaction),
    activity: activityRows.map(mapActivity),
  }
}

export const getAccountOverview = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await requireIdentityUser()
    return loadOverview(user)
  },
)

export const requestWithdrawal = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      amount: number
      method: string
      destination: string
      accountReference: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const user = await requireIdentityUser()
    const amountCents = amountToCents(data.amount)
    const method = data.method.trim()
    const destination = data.destination.trim()
    const accountReference = data.accountReference.trim()

    if (!withdrawalMethods.has(method)) {
      throw new Error('Choose a supported payout method.')
    }

    if (!destination || destination.length < 3) {
      throw new Error('Enter the destination account, wallet, email, or handle.')
    }

    if (!accountReference || accountReference.length < 3) {
      throw new Error('Enter the receiving account or wallet reference.')
    }

    const database = getDatabase()
    const client = await database.pool.connect()

    try {
      await client.query('BEGIN')

      const profileRows = await client.query(
        `INSERT INTO account_profiles (user_id, email, display_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET
           email = EXCLUDED.email,
           display_name = COALESCE(EXCLUDED.display_name, account_profiles.display_name),
           updated_at = NOW()
         RETURNING *`,
        [user.id, user.email ?? 'unknown@example.com', user.name ?? null],
      )
      const profile = mapProfile(profileRows.rows[0])
      const previousWithdrawals = await client.query(
        `SELECT COUNT(*)::int AS count FROM transaction_records
         WHERE user_id = $1 AND type = 'withdrawal'`,
        [user.id],
      )
      const isFirstWithdrawal = Number(previousWithdrawals.rows[0]?.count ?? 0) === 0
      const feeCents = isFirstWithdrawal ? Math.ceil(amountCents * 0.008) : 0
      const debitCents = amountCents

      if (profile.availableBalanceCents < debitCents) {
        throw new Error('Available balance is not enough to cover the withdrawal.')
      }

      const transactionId = crypto.randomUUID()
      const activityId = crypto.randomUUID()

      await client.query(
        `UPDATE account_profiles
         SET available_balance_cents = available_balance_cents - $1,
             lifetime_withdrawn_cents = lifetime_withdrawn_cents + $2,
             verification_status = CASE
               WHEN verification_status = 'verified' THEN verification_status
               ELSE 'pending_review'
             END,
             updated_at = NOW()
         WHERE user_id = $3`,
        [debitCents, amountCents, user.id],
      )
      await client.query(
        `INSERT INTO transaction_records
          (id, user_id, type, method, destination, account_reference, amount_cents, fee_cents, status, note)
         VALUES ($1, $2, 'withdrawal', $3, $4, $5, $6, $7, 'pending_verification', $8)`,
        [
          transactionId,
          user.id,
          method,
          destination,
          accountReference,
          amountCents,
          feeCents,
          isFirstWithdrawal
            ? 'First withdrawal — 0.8% processing token paid separately to the disclosed BTC token address.'
            : 'Withdrawal request submitted for review.',
        ],
      )
      await client.query(
        `INSERT INTO account_activity (id, user_id, title, detail)
         VALUES ($1, $2, $3, $4)`,
        [
          activityId,
          user.id,
          'Withdrawal requested',
          `${method} payout submitted and waiting for verification.`,
        ],
      )

      await client.query('COMMIT')
      return loadOverview(user)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  })
