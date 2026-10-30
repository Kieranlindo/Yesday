# Yesday

Wedding venues with real prices and live dates. This is the web platform: couples find, like and price venues; venues sign in to their dashboard.

## Run it on your computer

1. Install Node 20 or later and Postgres 16.
2. Copy `.env.example` to `.env.local` and fill it in (`DATABASE_URL` can be a local Postgres).
3. `npm install`
4. `npm run db:migrate` then `npm run db:seed` (adds the 11 sample London venues)
5. `npm run dev` and open http://localhost:3000

Checks: `npm run typecheck` and `node --import tsx --test tests/*.test.ts`.

## How it's built

- Next.js (App Router) and React, server-rendered, with server actions for forms.
- Postgres through Drizzle ORM. In production this is Supabase's Postgres, reached with its connection-pooler string.
- Our own sign-in: hashed passwords (bcrypt) and a session cookie.
- Money is stored in pence. Booking rules (fee, deposit range, cancellations, instalments) live in `src/lib/rules.ts`, with tests.
- On phones the website shows a prompt to use the app instead.

## Going live on Vercel

Set these in the Vercel project's environment variables, never in the code:
`DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`.
To set up the Supabase database the first time, paste `supabase/setup.sql` into Supabase's SQL Editor and run it once. It creates the tables and adds the sample venues. Later changes to the database come as new migrations.
