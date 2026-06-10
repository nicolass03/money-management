# money-management

A personal finance dashboard for tracking income, expenses, and cash-flow projections. The UI uses a terminal-inspired aesthetic (monospace type, shell-style navigation) and is built for a single user—you, on your own Supabase project.

## What it does

| Area | Description |
|------|-------------|
| **Expenses** | Log one-off expenses, manage recurring bills and subscriptions, and plan future purchases. Tag spending and view charts for the current pay period. |
| **Income** | Define pay schedules (weekly, biweekly, monthly, yearly) and record income entries. Scheduled income can sync automatically into entries. |
| **Projections** | Forecast free cash per pay period by combining your primary income schedule with actual, recurring, and planned expenses. Supports multi-currency conversion. |
| **Savings** | Basic savings entry list (UI still evolving). |
| **Settings** | Choose a display currency (EUR, USD, COP), configure exchange rates, and set projection options (primary pay schedule, starting balance, start date). |
| **Privacy mode** | Toggle masking of sensitive amounts in the sidebar. |

Recurring expenses are not charged automatically in development. A daily job creates expense records when a recurring bill is due—see [Recurring expense cron](#recurring-expense-cron) below.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** for styling
- **Supabase** for authentication and hosted Postgres
- **Drizzle ORM** for schema, migrations, and queries

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- A [Supabase](https://supabase.com) project (free tier is fine)

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

In the Supabase dashboard:

1. **Authentication → Users** — create a user with an email and password. You will log in with the password only; the email is configured server-side.
2. **Settings → API** — copy the project URL and publishable key (`sb_publishable_...`).
3. **Settings → Database** — copy the Postgres connection string (URI). Use the **Transaction** pooler mode if you deploy to serverless hosting.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable API key (safe for the browser) |
| `AUTH_USER_EMAIL` | Email of your Supabase Auth user (must match the user you created) |
| `DATABASE_URL` | Postgres connection string |
| `CRON_SECRET` | *(optional, for production)* Secret token for the daily recurring-expense API |

### 4. Run database migrations

This applies the SQL migrations in `drizzle/migrations/` to your Supabase database:

```bash
npm run db:migrate
```

### 5. (Optional) Seed sample data

If the database is empty, you can load example income, expenses, and settings:

```bash
npm run db:seed
```

Seeding is skipped automatically if any user data already exists.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the password for your Supabase Auth user.

## Authentication

This app is designed for **one user**. The login page asks only for a password; the email comes from `AUTH_USER_EMAIL`. Supabase middleware keeps sessions fresh and protects all routes except `/login` and auth API endpoints.

## Recurring expense cron

Recurring expenses define a schedule; actual `expenses` rows are created when a payment is due. In production, run this daily:

**HTTP endpoint** (e.g. from a scheduler):

```bash
curl -X POST https://your-app.example.com/api/cron/daily-expenses \
  -H "Authorization: Bearer $CRON_SECRET"
```

**CLI script** (local or CI):

```bash
npm run cron:daily-expenses
# Or for a specific date:
npm run cron:daily-expenses -- 2026-06-10
```

Set `CRON_SECRET` in your environment and pass the same value in the `Authorization` header.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Insert sample data (only if the DB is empty) |
| `npm run db:generate` | Generate a new migration after schema changes |
| `npm run db:studio` | Open Drizzle Studio to inspect the database |
| `npm run cron:daily-expenses` | Charge due recurring expenses for today (or a given date) |

## Project structure

```
src/
├── app/                    # Routes, pages, and API handlers
│   ├── (app)/              # Authenticated pages (expenses, income, …)
│   ├── api/                # Auth and cron endpoints
│   └── login/              # Login page
├── components/
│   ├── ui/                 # Shared UI primitives
│   ├── layout/             # App shell, sidebar, privacy toggle
│   ├── expenses/         # Expense dashboards and forms
│   ├── income/             # Income schedules and entries
│   ├── projections/        # Cash-flow projection views
│   └── settings/           # Currency and projection settings
└── lib/
    ├── db/                 # Drizzle schema, queries, seed
    ├── supabase/           # Supabase client and middleware
    ├── auth/               # Password sign-in helper
    ├── currency/           # Formatting and exchange-rate conversion
    ├── income/             # Pay-period calculations
    ├── expenses/           # Tags and recurring charge logic
    └── projections/        # Projection builder

drizzle/migrations/         # Generated SQL migrations
scripts/                    # Migrate, seed, and cron CLI scripts
```

## Schema changes

1. Edit `src/lib/db/schema.ts`.
2. Run `npm run db:generate` to create a migration.
3. Run `npm run db:migrate` to apply it.

## Deployment notes

- Set all variables from `.env.example` (plus `CRON_SECRET` if using the cron endpoint).
- Run `npm run db:migrate` before or during deploy so the database schema is up to date.
- Use the Supabase **Transaction** pooler connection string for `DATABASE_URL` on serverless platforms.
- Schedule a daily POST to `/api/cron/daily-expenses` so recurring bills appear on time.
