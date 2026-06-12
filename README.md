# money-management

A personal finance dashboard for tracking income, expenses, and cash-flow projections. The UI uses a terminal-inspired aesthetic (monospace type, shell-style navigation) and is built for a single user on your own Supabase project.

## What it does

| Area | Description |
|------|-------------|
| **Expenses** | Log one-off expenses, manage recurring bills and subscriptions, and plan future purchases. Tag spending and view charts for the current pay period. |
| **Income** | Define pay schedules (weekly, biweekly, monthly, yearly) and record income entries. Scheduled income syncs automatically into entries. |
| **Projections** | Forecast free cash per pay period by combining your primary income schedule with actual, recurring, and planned expenses. Supports multi-currency conversion. |
| **Savings** | Basic savings entry list (UI still evolving). |
| **Settings** | Choose a display currency (EUR, USD, COP), configure exchange rates, and set projection options (primary pay schedule, starting balance, start date). |
| **Privacy mode** | Toggle masking of sensitive amounts in the sidebar. |

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** for styling
- **Supabase Auth** for login and session management
- **[money-management-api](../money-management-api)** (Rust/Axum) for all business logic and database access

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) (for the API)
- A [Supabase](https://supabase.com) project (free tier is fine)

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

In the Supabase dashboard:

1. **Authentication → Users** — create a user with an email and password. You will log in with the password only; the email is configured server-side.
2. **Settings → API** — copy the project URL, publishable key (`sb_publishable_...`), and JWT secret.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable API key (safe for the browser) |
| `API_URL` | Rust API base URL (default `http://localhost:8080`) |

The Rust API needs its own `.env` with `DATABASE_URL` and `SUPABASE_URL`. See the [API README](../money-management-api/README.md).

### 4. Start the API and dev server

```bash
# Terminal 1 — Rust API
cd ../money-management-api && cargo run

# Terminal 2 — Next.js UI
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your Supabase Auth email and password.

## Authentication

The login page accepts email and password via Supabase Auth. Middleware keeps sessions fresh and protects all routes except `/login` and auth API endpoints. The UI forwards the Supabase JWT to the Rust API for all data requests.

## Recurring expense charging

Recurring expenses define a schedule; actual `expenses` rows are created when a payment is due. The Rust API runs an **internal daily scheduler** (no HTTP endpoint). Keep at least one API instance running with `ENABLE_INTERNAL_CRON=true` (default).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── app/                    # Routes, pages, and auth API handlers
│   ├── (app)/              # Authenticated pages (expenses, income, …)
│   ├── api/auth/           # Login and logout
│   └── login/              # Login page
├── components/             # UI by domain (expenses, income, projections, …)
└── lib/
    ├── api/                # Typed HTTP client for the Rust API
    ├── types/              # Domain types and constants
    ├── supabase/           # Supabase client and middleware
    ├── auth/               # Password sign-in helper
    ├── currency/           # Formatting and conversion (display only)
    ├── income/             # Pay-period calculations (display)
    ├── expenses/           # Period views and tag utilities
    └── projections/        # Period item builders (display)
```

## Deployment notes

- Set all variables from `.env.example` on the Next.js app.
- Deploy the Rust API with `DATABASE_URL`, `SUPABASE_URL`, and `CORS_ORIGIN`.
- Point `API_URL` at the deployed API.
- Keep the API process running so the internal daily expense scheduler can charge recurring bills on time.
