# money-management — agent notes

## Database & API

- All entity IDs are **UUID strings** (JSON and TypeScript `string`). Amount fields remain integer cents.
- The Rust API (`money-management-api`) owns the Postgres schema. Migrations live in `money-management-api/migrations/`.
- `users.id` equals Supabase Auth `sub` (JWT). All user-owned tables have `user_id` FK; repos filter by authenticated user.
- `exchange_rate_snapshots` is **global** (no `user_id`) — shared FX cache.
- `user_settings` is keyed by `user_id` (one row per user), not a singleton `id = 1`.
- **Daily recurring expenses** are charged by an in-process scheduler in the Rust API (`src/jobs/daily_expenses.rs`). There is no HTTP cron route. Multi-replica deploys use a Postgres advisory lock. Set `ENABLE_INTERNAL_CRON=false` to disable.
- Postgres **RLS** is enabled (migration `20250612130000_row_level_security`). Repos call `connection::user_connection` / `set_user_context` so `app.user_id` is set per request; internal jobs use `admin_connection` for cross-tenant operations like listing all users.

## Migrations (Diesel)

- Unused `Queryable` row fields (e.g. `user_id` not exposed in API responses) can be prefixed with `_` to silence dead-code warnings, but **must** keep `#[diesel(column_name = user_id)]` so Diesel still maps the DB column.
- Helpers called inside `conn.transaction` closures should return `diesel::result::Error`, not `ApiError` (the transaction `?` operator cannot convert `ApiError`).

Supabase **transaction pooler** (port `6543`) breaks Diesel prepared statements. For `diesel migration run` and `diesel print-schema`, use **session mode** (port `5432` on the pooler host).

**Load `.env` first** — Diesel CLI does not read `money-management-api/.env` automatically. If `DATABASE_URL` is unset, Diesel falls back to **SQLite** and Postgres migrations fail with `near "EXTENSION": syntax error`.

```bash
cd money-management-api
set -a && source .env && set +a
export DATABASE_URL="${DATABASE_URL//:6543/:5432}"
diesel migration run
diesel print-schema > src/schema.rs
```

Or: `./scripts/migrate.sh` from `money-management-api`.

If `cargo run` fails with `DATABASE_URL is required` while `.env` is set, the shell may still export an empty `DATABASE_URL` from a prior `export DATABASE_URL="${DATABASE_URL//:6543/:5432}"` — run `unset DATABASE_URL` or open a fresh terminal. The API loads `.env` with override from the crate root.

## Auth

- Users sign in with email and password on `/login`. Any valid Supabase Auth JWT is accepted by the API.
- Default seeded user: `9886a71c-56d5-4cbe-a566-d762f24d0c9e` / `nickph116@gmail.com`.
- Supabase **JWT signing keys** issue **ES256** access tokens. The Rust API validates them by fetching public keys from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` — do not use the legacy `SUPABASE_JWT_SECRET`. A 401 with API log `InvalidAlgorithm` or `unsupported jwt algorithm` means JWKS validation is missing or stale — restart the API after key rotation.

## Theming

- Semantic color tokens live in `src/app/globals.css` (`--bg`, `--surface`, `--text`, etc.) and map to Tailwind utilities via `@theme inline`.
- Light mode overrides the same tokens under the `.light` class, toggled by [`next-themes`](https://github.com/pacocoursey/next-themes) in `src/components/layout/theme-provider.tsx` (root layout).
- Theme preference: **dark** (default), **light**, or **system** (follows OS). Persisted in `localStorage` under key `theme`. Switcher: sidebar footer + login page (`ThemeSwitcher`).
- Recharts cannot read CSS variables — use `useChartTheme()` from `src/hooks/use-chart-theme.ts`; do not hardcode hex colors in chart components.
- Focus/hover glows use `--glow-color` (theme-aware); scanlines use `--scanline-color`.

## Next.js

- This app has **no local Drizzle DB** — all data goes through `src/lib/api/*` → Rust API.
- Do not use `number` for entity/FK IDs in domain types or API clients.
- `apiFetch` validates the session with `getUser()` before forwarding the JWT to the Rust API.
- Auth route handlers (`/api/auth/login`, `/api/auth/logout`) require the `X-Requested-With: XMLHttpRequest` header — client fetches must use `authFetchHeaders` from `src/lib/auth/csrf.ts`.
- Login is rate-limited (10 attempts per 15 minutes per IP and per email) in `src/lib/auth/rate-limit.ts`.
- Use server-only `API_URL` for the Rust API base URL — do not add `NEXT_PUBLIC_API_URL`.
- HTTP security headers are configured in `next.config.ts` (CSP, HSTS in production, etc.).
- Server actions redirect to `/login` on 401 via `handleActionError` in `src/lib/actions/action-error.ts`.

## Railway deployment (UI)

- `Dockerfile` builds Next.js with `output: "standalone"` and runs `node server.js` on `0.0.0.0:$PORT`.
- `railway.toml` sets `healthcheckPath = "/login"` (public route; authenticated pages redirect).
- Set `NEXT_PUBLIC_*` variables **before** the first build — they are inlined at compile time. Changing them requires a redeploy/rebuild.
- `API_URL` is server-only and read at runtime; update without rebuild if the API domain changes (still redeploy to pick up in some edge cases — prefer setting it before first deploy).
- After generating the UI domain, add it to the API’s `CORS_ORIGIN`.
