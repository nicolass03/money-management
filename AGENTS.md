# money-management — agent notes

## Database & API

- All entity IDs are **UUID strings** (JSON and TypeScript `string`). Amount fields remain integer cents.
- The Rust API (`money-management-api`) owns the Postgres schema. Migrations live in `money-management-api/migrations/`.
- `users.id` equals Supabase Auth `sub` (JWT). All user-owned tables have `user_id` FK; repos filter by authenticated user.
- `exchange_rate_snapshots` is **global** (no `user_id`) — shared FX cache.
- `user_settings` is keyed by `user_id` (one row per user), not a singleton `id = 1`.
- **Daily recurring expenses** are charged by an in-process scheduler in the Rust API (`src/jobs/daily_expenses.rs`). There is no HTTP cron route. Multi-replica deploys use a Postgres advisory lock. Set `ENABLE_INTERNAL_CRON=false` to disable.
- **Daily scheduled income** is materialized by the **same** scheduler (`charge_due_income_for_date`) — one actual `income` row per pay date, mirroring recurring expenses. Income pay schedules are the "planned income"; there is no separate planned-income entity. Web: income entries now show **all** active rows (manual + materialized scheduled) — manual rows get full edit + delete; scheduled rows get **amount-only** edit (`useUpdateIncomeAmount`) + delete (soft-deleted server-side). `filter-income-entries.ts` no longer hides scheduled rows, and the removed `syncScheduledIncome` API helper is gone. `incomeChange` invalidation refreshes income + projections; projections include future schedule occurrences (server-computed).
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

- Semantic color tokens live in `src/globals.css` (`--bg`, `--surface`, `--text`, etc.) and map to Tailwind utilities via `@theme inline`.
- Light mode overrides the same tokens under the `.light` class, toggled by [`next-themes`](https://github.com/pacocoursey/next-themes) in `src/components/layout/theme-provider.tsx` (root layout).
- Theme preference: **dark** (default), **light**, or **system** (follows OS). Persisted in `localStorage` under key `theme`. Switcher: sidebar footer + login page (`ThemeSwitcher`).
- Recharts cannot read CSS variables — use `useChartTheme()` from `src/hooks/use-chart-theme.ts`; do not hardcode hex colors in chart components.
- Focus/hover glows use `--glow-color` (theme-aware); scanlines use `--scanline-color`.
- Overlay dialogs use `TerminalModal` (`src/components/ui/terminal-modal.tsx`) — portaled, `~/title` header, `esc` close, scrollable body. Example: **mark as paid** (`mark-early-payment-panel.tsx`).

## Localization

- Web localization uses `react-i18next` (`src/lib/i18n/index.ts`) with locale resources under `src/locales/en/*.json` and `src/locales/es/*.json`.
- Language preference is API-backed in `user_settings.language` (`en` | `es`) and surfaced in Settings (`src/components/settings/language-settings.tsx`).
- `LanguageProvider` (`src/lib/i18n/language-provider.tsx`) applies the active language to i18n + `document.documentElement.lang`, bootstraps from `localStorage` key `incm-mgmt-language`, and then syncs from `/settings` once authenticated.
- Keep currency formatting tied to currency code (`src/lib/currency/format.ts`); date formatting follows UI language (`formatDate` in `src/lib/utils.ts`).

## Vite SPA (TanStack Router + Query)

- **Vite 6** + React 19. Entry: `index.html` → `src/main.tsx`. Routes: file-based under `src/routes/` (TanStack Router plugin generates `src/routeTree.gen.ts`).
- **JSX via esbuild** — `vite.config.ts` sets `esbuild: { jsx: 'automatic' }`. Do **not** add `@vitejs/plugin-react` unless you need React Fast Refresh; its dev path uses Babel + `react-refresh`, which broke when `@babel/types@7.29` removed `t.identifier()` (esbuild is Vite's default and avoids that toolchain).
- **No Next.js** — no RSC, Server Actions, or middleware. Auth uses `@supabase/supabase-js` in the browser (`src/lib/supabase/client.ts`, `src/lib/auth/session-store.tsx`).
- All data goes through `src/lib/api/*` → Rust API with `Authorization: Bearer` from the Supabase session (`src/lib/api/client.ts`).
- **TanStack Query** hooks in `src/hooks/use-queries.ts`; mutations in `src/lib/mutations/*`. Cache invalidation mirrors iOS `InvalidationMap` in `src/lib/query/invalidation.ts` — call `invalidateAfter(queryClient, event)` after writes.
- Tab visibility refresh: `visibilitychange` in `src/main.tsx` invalidates all queries (parity with iOS `scenePhase == .active`).
- Do not use `number` for entity/FK IDs in domain types or API clients.
- Login uses direct `supabase.auth.signInWithPassword` (no BFF proxy). Rate limiting relies on Supabase Auth (the old Next.js IP/email limiter was removed).
- Env vars (`.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL` — all baked at **build time**. Set them in Railway before the first deploy.
- HTTP security headers for production are set in `nginx/default.conf.template` (CSP, HSTS). Health check: `GET /health`.
- `server.js` remains for local `npm start` only; Railway serves via **nginx** in Docker.
- Ensure Rust API `CORS_ORIGIN` includes the deployed UI origin (browser calls API directly, same as iOS).

## Expenses tab loading

The expenses tab no longer blocks on 8 parallel fetches. Init uses **settings** (with embedded `primarySchedule`), **money-context**, and section queries:

- `useExpensePeriodView(period)` → hero + period list **and charts** (`byTag` / `subscriptionSplit` are embedded in the period-view response, so `ExpenseCharts` reads `periodView` directly — there is no separate chart-summary request)
  - The `expense_analytics` section header subtitle shows `periodView.totalSpend` (includes projected recurring/planned/budget rows for the pay period). The left chart column is **not** the old `by_type` pie; it is two KPI cards (`expense-period-kpis.tsx`): `total_spent` (sum of `byTag` = **actual** persisted spend only) and `extra_spent` (`periodView.extraSpent` = manual/unplanned spend). The `extra_spent` card shows `/ limit` and a warning color (`text-warning` ≥70% used, `text-danger` ≥92% / over) **only for the pay period** (`isPayPeriod`); `last-month` / `last-3-months` show extra spend alone. `subscriptionSplit` is still returned by the API but no longer rendered. Limit is configured in settings (`extra-spent-settings.tsx` → `useUpdateExtraSpentLimit`); `--warning` token lives in `globals.css`. Persisted manual expenses in the period list show a yellow `extra` badge (`Badge variant="warning"`) next to the name — same rule as `extraSpent` (no `recurringId` / `plannedExpenseId` / `budgetId`). The **current_period** list (`current-period-expenses.tsx`) omits `projected` rows client-side (unmaterialized recurring/planned); the fetch still passes `includeProjected=true` so `totalSpend` in analytics includes planned rows. Materialized recurring/planned expenses (`projected: false`) remain in the list.
- `useUpcomingPayable()` → **mark as paid** row opens `TerminalModal` with scrollable upcoming-payable list (not an inline collapsible).

Each section shows **inline skeletons** (`src/components/ui/skeleton.tsx`, `src/components/ui/list-skeletons.tsx`, `src/components/expenses/expense-loading-skeletons.tsx`) for backend-dependent content; the shell renders immediately. Tags load only when opening the expense form. Period toggle refetches period-view only.

**Budgets, income, projections** use the same pattern — page shell + section skeletons; no full-screen `LoadingIndicator` on those tabs (component kept for auth/login and other routes).

## Railway deployment (UI)

- Multi-stage `Dockerfile`: Node builds `dist/`, **nginx:alpine** serves static files with SPA fallback (`try_files` → `/index.html`). `nginx/docker-entrypoint.sh` binds Railway’s injected `PORT`.
- `railway.toml` sets `healthcheckPath = "/health"`.
- Set `VITE_*` service variables **before** the first build — Dockerfile declares them as `ARG`/`ENV` in the builder stage so Vite inlines them. Changing them requires a redeploy/rebuild. A blank page after deploy usually means `VITE_*` were missing at image build time.
- After generating the UI domain, add it to the API’s `CORS_ORIGIN`.
