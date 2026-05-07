# Payout Ledger

Payout Ledger is a Netlify-hosted TanStack Start dashboard for user accounts, payout balances, withdrawal requests, transaction history, and administrative funding workflows.

Users can register, log in, review available balance and account activity, request withdrawals to supported payment apps, banks, or crypto payout methods, and see processing status updates. Administrators have a separate route for monitoring user records, crediting account balances, and updating withdrawal status.

## Key Technologies

- TanStack Start with React 19 and TanStack Router
- Tailwind CSS 4 for styling
- Netlify Identity through `@netlify/identity` for account registration, login, and role-aware admin access
- Netlify Database through `@netlify/database` for persistent account profiles, transactions, balances, and activity logs
- Netlify deploy migrations in `netlify/database/migrations`

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The Vite app runs on port 3000. Netlify Identity requires a deployed Netlify environment for full authentication behavior because the Identity cookies and service are provided by Netlify.

## Main Routes

- `/login` - registration, login, and password recovery
- `/` - authenticated user dashboard
- `/withdrawals` - withdrawal request form with first-withdrawal fee disclosure
- `/transactions` - transaction and status history
- `/admin` - role-protected administrator dashboard
