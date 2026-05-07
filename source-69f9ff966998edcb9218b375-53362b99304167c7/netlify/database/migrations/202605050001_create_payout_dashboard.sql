CREATE TABLE IF NOT EXISTS account_profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  verification_status TEXT NOT NULL DEFAULT 'not_started',
  account_status TEXT NOT NULL DEFAULT 'active',
  available_balance_cents INTEGER NOT NULL DEFAULT 0,
  lifetime_credited_cents INTEGER NOT NULL DEFAULT 0,
  lifetime_withdrawn_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES account_profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  method TEXT NOT NULL,
  destination TEXT,
  account_reference TEXT,
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transaction_records_user_id_created_at_idx
  ON transaction_records (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS transaction_records_status_idx
  ON transaction_records (status);

CREATE TABLE IF NOT EXISTS account_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES account_profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS account_activity_user_id_created_at_idx
  ON account_activity (user_id, created_at DESC);
