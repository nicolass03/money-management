# money-mgmt

Personal income, expenses, and savings tracker with a terminal-inspired UI.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a [Supabase](https://supabase.com) project.

3. Copy environment variables:

```bash
cp .env.example .env
```

4. Fill in `.env`:

   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (Settings → API)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key `sb_publishable_...` (Settings → API Keys)
   - `AUTH_USER_EMAIL` — email of your Supabase Auth user (Authentication → Users)
   - `DATABASE_URL` — Postgres connection string (Settings → Database → URI, use Transaction pooler)

5. Create a user in Supabase Auth (Authentication → Users) and set their password. Put the same email in `AUTH_USER_EMAIL`.

6. Initialize the database:

```bash
npm run db:migrate
```

7. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your Supabase Auth password.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Run migrations and seed sample data |
| `npm run db:generate` | Generate new migration from schema changes |
| `npm run db:studio` | Open Drizzle Studio |

## Railway deployment

1. Create a new Railway project from this repo.
2. Set environment variables from `.env.example`.
3. Deploy — `railway.toml` runs migrations before start.

## Project structure

```
src/
├── app/              # Routes and API
├── components/
│   ├── ui/           # Presentational primitives
│   ├── layout/       # Sidebar and shell
│   ├── expenses/     # Expense domain components
│   ├── income/
│   └── savings/
└── lib/
    ├── db/           # Supabase Postgres + Drizzle
    ├── supabase/     # Supabase client helpers
    └── auth/         # Supabase auth helpers
```
