# AGENTS.md

This project is Payout Ledger, a TanStack Start application deployed on Netlify for user account balances, payout requests, transaction history, and administrator balance management.

## Architecture

- `src/routes/__root.tsx` defines the document shell, metadata, and wraps the app in Netlify Identity context plus auth callback handling.
- `src/routes/login.tsx` provides registration, login, and password recovery through `@netlify/identity`.
- `src/routes/index.tsx` is the authenticated user dashboard showing balance, verification status, recent transactions, and account activity.
- `src/routes/withdrawals.tsx` lets users request payouts to payment apps, banks, or crypto wallets. It displays the 0.8% first-withdrawal fee before submission.
- `src/routes/transactions.tsx` shows deposits, credits, withdrawals, fees, notes, and status updates.
- `src/routes/admin.tsx` is role-gated server-side by Netlify Identity roles and supports user monitoring, balance credits, and withdrawal status changes.
- `src/server/accounts.ts` contains server functions for account profile creation, balance reads, withdrawal mutations, admin credits, and status updates.
- `netlify/database/migrations/` contains SQL migrations applied by Netlify Database during deploy.

## Data And Auth

Persistent records must use Netlify Database. Do not replace account records, balances, transaction history, or activity logs with in-memory state, local JSON files, browser storage, or an external database.

Authentication must use `@netlify/identity`. Admin access is checked in server functions with the `admin` role from Netlify Identity. Client-side route gating is only a user experience layer and is not the security boundary.

Users start at a zero available balance until credited by an administrator. Withdrawal requests deduct the requested amount plus any first-withdrawal fee while the request is pending. Rejected or canceled withdrawals are refunded by the admin status update path.

## Coding Conventions

- Use TypeScript with strict types.
- Prefer `@/` imports for source files.
- Use TanStack Start server functions for database-backed reads and mutations used by routes.
- Keep SQL schema changes in new migration files under `netlify/database/migrations/`; never apply migrations manually.
- Keep UI styling in Tailwind utility classes and shared global basics in `src/styles.css`.
- Keep user-facing financial copy explicit about fees, destination details, verification, and processing status.

## Development Commands

```bash
npm run dev
```

Do not run production build commands during agent edits. Netlify validation handles builds after changes.
