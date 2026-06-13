# UI Design System — incm-mgmt

A replication guide for the terminal-inspired dark UI used in this app. The aesthetic is deliberately **CLI / hacker-terminal**: monospace type, near-black surfaces, sharp borders, subtle glow, and copy that reads like shell commands.

---

## Design philosophy

| Principle | What it means in practice |
|-----------|---------------------------|
| **Terminal-first** | Labels use `snake_case`, nav paths look like `~/expenses`, prompts use `> ` and `$ ` prefixes, empty states say `> no entries yet.` |
| **Dark only** | Single theme; `color-scheme: dark` on `<html>`. No light mode toggle. |
| **Monospace everywhere** | JetBrains Mono on `body` and reinforced with `font-mono` on components. |
| **Flat & sharp** | No border-radius on cards, buttons, or inputs. Occasional `rounded` only on nested hint panels inside forms. |
| **Low chrome, high contrast** | Thin 1px borders, layered grays, white accent glow on focus/active states. |
| **Semantic color sparingly** | Green (`success`) = income/positive, red (`danger`) = expenses/negative. Most UI stays neutral gray. |
| **Motion with purpose** | Short fade/slide entrances (0.3–0.4s). Blinking cursor and glow pulse reinforce the terminal feel. |

---

## Tech stack

Replicate with the same tooling for the closest match:

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) |
| Styling | **Tailwind CSS v4** via `@import "tailwindcss"` in global CSS |
| PostCSS | `@tailwindcss/postcss` plugin |
| Font | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via `next/font/google` |
| Class merging | `clsx` + `tailwind-merge` → `cn()` helper |
| Animation | `framer-motion` for page/sidebar transitions; CSS keyframes for blink/glow |
| Charts | Recharts with hard-coded dark tooltip/axis styles |

### Dependencies to install

```bash
npm install clsx tailwind-merge framer-motion recharts
npm install -D tailwindcss @tailwindcss/postcss
```

---

## Step-by-step setup (new project)

### 1. PostCSS config

```js
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### 2. Global CSS — design tokens & effects

Copy the token block and global rules from `src/app/globals.css`. This is the **source of truth** for colors, Tailwind theme mapping, scanline overlay, and custom animations.

```css
@import "tailwindcss";

:root {
  --bg: #0a0a0a;
  --surface: #141414;
  --surface-elevated: #1a1a1a;
  --border: #2a2a2a;
  --text: #e8e8e8;
  --muted: #6b6b6b;
  --accent: #d4d4d4;
  --accent-glow: #ffffff;
  --success: #a3e635;
  --danger: #f87171;
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-elevated: var(--surface-elevated);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-accent-glow: var(--accent-glow);
  --color-success: var(--success);
  --color-danger: var(--danger);
  --font-mono: var(--font-jetbrains-mono);
}
```

Tailwind v4 maps these to utilities like `bg-bg`, `text-muted`, `border-accent/50`, etc.

### 3. Root layout — font

```tsx
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
```

### 4. `cn()` utility

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 5. Build UI primitives

Create `Button`, `Card`, `Input`, `Badge`, `SectionHeader`, and `LoadingIndicator` — class strings are documented in the **Component recipes** section below. Reference implementations live in `src/components/ui/`.

---

## Color palette

### Core tokens

| Token | Hex | Tailwind utility | Usage |
|-------|-----|------------------|-------|
| `bg` | `#0a0a0a` | `bg-bg` | Page background, expanded table rows |
| `surface` | `#141414` | `bg-surface` | Cards, sidebar, inputs |
| `surface-elevated` | `#1a1a1a` | `bg-surface-elevated` | Default badges, subtle elevation |
| `border` | `#2a2a2a` | `border-border` | All borders, dividers, chart axes |
| `text` | `#e8e8e8` | `text-text` | Primary body text |
| `muted` | `#6b6b6b` | `text-muted` | Labels, subtitles, axis ticks, placeholders |
| `accent` | `#d4d4d4` | `text-accent`, `border-accent` | Prompts, links, focus borders, chart bars |
| `accent-glow` | `#ffffff` | `text-accent-glow` | Active nav, highlights, savings totals |
| `success` | `#a3e635` | `text-success` | Income, positive balances |
| `danger` | `#f87171` | `text-danger` | Expenses, errors, negative balances |

### Opacity patterns

The UI relies heavily on tinted borders/backgrounds:

- **Primary button**: `border-accent bg-accent/10` → hover `bg-accent/20`
- **Ghost button**: `border-border` → hover `border-accent/50`
- **Active nav**: `border-accent/50 bg-accent/10`
- **Card hover**: `hover:border-accent/30`
- **Focus ring (inputs)**: `focus:shadow-[0_0_8px_rgba(255,255,255,0.1)]`
- **Primary button hover glow**: `hover:shadow-[0_0_12px_rgba(255,255,255,0.12)]`

### Chart colors

Grayscale ramp for pie/bar charts (lightest = most emphasis):

```ts
const COLORS = ["#ffffff", "#d4d4d4", "#a3a3a3", "#737373", "#525252"];
```

Bar fill default: `#d4d4d4` (`accent`). Bar corner radius: `[2, 2, 0, 0]` (only top corners).

Recharts tooltip style (use everywhere):

```ts
contentStyle: {
  background: "#141414",
  border: "1px solid #2a2a2a",
  fontFamily: "monospace",
  fontSize: 12,
}
```

Axis ticks: `fill: "#6b6b6b"`, `fontSize: 11`, `fontFamily: "monospace"`. Axis lines: `stroke: "#2a2a2a"`, `tickLine: false`.

---

## Typography

### Font

- **Family**: JetBrains Mono (loaded once on `<html>`, inherited by `body`)
- **Fallback**: `ui-monospace, monospace`
- Always add `font-mono` on interactive/text components for consistency

### Type scale

| Role | Classes | Example |
|------|---------|---------|
| App version / meta | `text-xs text-muted` | `incm-mgmt v0.1` |
| Section title | `text-lg text-text` + `.terminal-prompt` | `> expenses` (prompt added via CSS) |
| Page heading (sidebar) | `text-sm text-accent-glow` | `$ ./dashboard` |
| Body / list primary | `text-sm text-text` | Expense name |
| Body secondary / metadata | `text-xs text-muted` | `Jan 5, 2026 // groceries` |
| Form labels | `text-xs text-muted` | `amount:` |
| Buttons (md) | `text-sm` | `authenticate` |
| Buttons (sm) | `text-xs` | `recurring` |
| Micro copy | `text-[10px] text-muted` | `// please wait...` |

### Terminal copy conventions

- **Section titles**: `snake_case` — e.g. `expense_analytics`, `current_period`
- **Subtitles**: sentence case + `//` as inline comment separator — e.g. `analytics and spend by selected period`
- **Nav labels**: tilde paths — `~/expenses`, `~/settings`
- **Empty states**: leading `> ` — `> no expenses in this period.`
- **Errors**: prefix with `$` — `$ auth failed: invalid credentials`
- **Filter labels**: lowercase with colon — `filter:`, `period:`
- **Button labels**: lowercase verbs — `add expense`, `logout`, `privacy: off`

### CSS pseudo-element prompts

```css
.terminal-prompt::before {
  content: "> ";
  color: var(--accent);
}

.terminal-dollar::before {
  content: "$ ";
  color: var(--accent);
}
```

Use `.terminal-prompt` on section `<h2>` elements. The login page builds a faux shell prompt manually with colored spans.

---

## Layout & spacing

### App shell

```
┌─────────────┬──────────────────────────────────┐
│  Sidebar    │  Main content (scrollable)        │
│  w-56       │  p-6 md:p-8                       │
│  h-screen   │  flex-1 overflow-y-auto           │
│  sticky     │                                   │
└─────────────┴──────────────────────────────────┘
```

- Outer: `flex h-screen overflow-hidden bg-bg`
- Sidebar: `w-56 shrink-0 border-r border-border bg-surface sticky top-0 h-screen`
- Main: `min-h-0 flex-1 overflow-y-auto p-6 md:p-8`
- Main enters with: `opacity 0→1`, `y: 8→0`, `duration: 0.3`, `delay: 0.1`

### Page structure

Typical page block:

1. **Header row** — `mb-6 flex items-center justify-between gap-4`
   - `SectionHeader` on the left (`className="mb-0"` when in a row)
   - Actions / total badge on the right
2. **Optional filters** — `flex flex-wrap items-center gap-2` with `text-xs text-muted` label
3. **Content cards** — `space-y-4` or `grid gap-4 md:grid-cols-3`
4. **Sections below fold** — `mt-8` between major sections

### Sidebar anatomy

- **Header block**: `border-b border-border px-4 py-5`
- **Nav**: `flex-1 py-2`
- **Footer actions**: `border-t border-border p-4 space-y-2` — full-width ghost buttons

### List inside cards

```html
<div class="divide-y divide-border">
  <div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
    ...
  </div>
</div>
```

### Grid tables (projections)

- Header row: `grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border px-4 py-3 text-xs text-muted`
- Data rows: same grid, `hover:bg-surface/60` on interactive rows
- Expanded detail: `border-t border-border/60 bg-bg/40 px-4 py-3 pl-10`

---

## Visual effects

### Scanline overlay (global CRT feel)

Applied via `body::before` — fixed full-screen, `pointer-events: none`, `z-index: 9999`:

```css
background: repeating-linear-gradient(
  0deg,
  transparent,
  transparent 2px,
  rgba(0, 0, 0, 0.03) 2px,
  rgba(0, 0, 0, 0.03) 4px
);
```

Do not remove this when replicating — it is subtle but part of the identity.

### Animations

| Name | Class | Behavior |
|------|-------|----------|
| Blink cursor | `.animate-blink` | `opacity 1↔0`, 1s, `step-end`, infinite — used on `_` characters |
| Glow pulse | `.animate-glow-pulse` | Box-shadow pulse, 3s ease-in-out — used on login card, pie chart card |
| Spinner | `animate-spin` on bordered square | Terminal-style loader, not a circular SVG |
| Page enter | Framer `motion` | `opacity` + `y` offset, ~0.3–0.4s |
| Sidebar active indicator | Framer `layoutId="sidebar-active"` | Spring transition between nav items |

### Focus & hover

- **Transitions**: `transition-colors` on cards/inputs; `transition-all duration-200` on buttons
- **No rounded focus rings** — use border color change + soft white box-shadow
- **Links**: `text-accent hover:text-accent-glow`

---

## Component recipes

### Button

Three variants, two sizes. Base:

```
inline-flex items-center justify-center font-mono transition-all duration-200
disabled:opacity-50 disabled:cursor-not-allowed
```

| Variant | Key classes |
|---------|-------------|
| `primary` | `border border-accent bg-accent/10 text-text hover:bg-accent/20 hover:shadow-[0_0_12px_rgba(255,255,255,0.12)]` |
| `ghost` | `border border-border bg-transparent text-muted hover:text-text hover:border-accent/50` |
| `danger` | `border border-danger/50 bg-danger/10 text-danger hover:bg-danger/20` |

| Size | Classes |
|------|---------|
| `sm` | `px-3 py-1.5 text-xs` |
| `md` | `px-4 py-2 text-sm` |

Loading state: prepend `TerminalSpinner` (`size-3` bordered square with `animate-spin`).

**Toggle pattern** (period selector, privacy mode): `primary` when active, `ghost` when inactive.

### Card

```
border border-border bg-surface p-4 transition-colors hover:border-accent/30
```

- Table-style cards: `overflow-hidden p-0` with padding on inner rows
- Nested form panels: `rounded border border-border/60 bg-bg/50 px-3 py-2` (rare exception to sharp corners)

### Input

```
w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text
placeholder:text-muted outline-none transition-colors
focus:border-accent focus:shadow-[0_0_8px_rgba(255,255,255,0.1)]
```

### Select (native)

Match input styling — no custom dropdown component:

```
w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text
outline-none transition-colors focus:border-accent
```

### Checkbox

```
accent-accent
```

On a `label` with `flex items-center gap-2 font-mono text-sm text-text`.

### Badge

```
inline-flex items-center border px-2 py-0.5 font-mono text-xs
```

| Variant | Classes |
|---------|---------|
| `default` | `border-border bg-surface-elevated text-muted` |
| `accent` | `border-accent/50 bg-accent/10 text-accent-glow` |
| `success` | `border-success/50 bg-success/10 text-success` |
| `danger` | `border-danger/50 bg-danger/10 text-danger` |

Use as filter chips: wrap in `<button>`, toggle `accent` vs `default`, add `opacity-70 hover:opacity-100` when inactive.

### SectionHeader

```tsx
<div className="mb-4">
  <h2 className="terminal-prompt font-mono text-lg text-text">{title}</h2>
  {subtitle && (
    <p className="mt-1 font-mono text-xs text-muted">{subtitle}</p>
  )}
</div>
```

### LoadingIndicator

**Inline**: spinner + label + blinking `_`

**Page**: centered `min-h-[40vh]`, faux terminal line `> loading_`, plus a card with animated gradient progress bar:

- Track: `h-1 bg-border/50`
- Bar: `w-1/3 bg-gradient-to-r from-transparent via-accent/80 to-transparent` animating left `-33%` → `100%`

### Nav item (active state)

- Inactive: `text-muted hover:text-text`, prefix two spaces before label
- Active: `text-accent-glow`, prefix `> `, animated background `border border-accent/50 bg-accent/10`

---

## Semantic money colors

Apply consistently when showing financial values:

| Meaning | Class |
|---------|-------|
| Income / positive | `text-success` with `+` prefix |
| Expense / negative | `text-danger` with `-` prefix |
| Conditional balance | `text-success` if ≥ 0, else `text-danger` |
| Cumulative highlight | `text-accent-glow` when positive |
| Savings / totals in badge | `text-accent-glow` inside `Badge variant="accent"` |
| Secondary amount | `text-muted` in parentheses |

---

## Motion reference (Framer Motion)

Use these as defaults when replicating page transitions:

```tsx
// Main content
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, delay: 0.1 }}

// Sidebar
initial={{ x: -20, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
transition={{ duration: 0.3 }}

// Login / chart sections
initial={{ opacity: 0, y: 12 }}  // or y: 20 for login
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4 }}

// Nav active background
transition={{ type: "spring", stiffness: 350, damping: 30 }}
```

---

## Login page pattern

Standalone full-screen layout (no sidebar):

- Centered column: `flex min-h-screen items-center justify-center bg-bg p-4`
- Max width: `max-w-md`
- Faux terminal header above the card (version string + `user@local:~$ auth --login_`)
- Card with `animate-glow-pulse`
- Loading overlay: `absolute inset-0 z-10 flex items-center justify-center border border-accent/20 bg-surface/90`

---

## File map (this repo)

| Path | Purpose |
|------|---------|
| `src/app/globals.css` | Tokens, scanlines, animations, terminal CSS |
| `src/app/layout.tsx` | Font loading |
| `src/components/ui/*` | Primitives (Button, Card, Input, Badge, etc.) |
| `src/components/layout/app-shell.tsx` | Shell layout + main animation |
| `src/components/layout/sidebar.tsx` | Sidebar structure + branding |
| `src/components/layout/nav-item.tsx` | Active nav animation |
| `src/app/login/page.tsx` | Auth screen reference |
| `src/components/expenses/expense-charts.tsx` | Chart styling reference |
| `src/lib/utils.ts` | `cn()` helper |

---

## Replication checklist

Use this when starting a new app:

- [ ] Install Tailwind v4, PostCSS plugin, clsx, tailwind-merge, framer-motion
- [ ] Copy `:root` tokens and `@theme inline` block to `globals.css`
- [ ] Add scanline `body::before`, blink/glow keyframes, terminal pseudo-classes
- [ ] Load JetBrains Mono on `<html>`; set `body` background, color, `font-family`, `min-height: 100vh`
- [ ] Set `html { color-scheme: dark; }`
- [ ] Create `cn()` utility
- [ ] Build 6 UI primitives: Button, Card, Input, Badge, SectionHeader, LoadingIndicator
- [ ] Implement app shell: fixed sidebar `w-56` + scrollable main `p-6 md:p-8`
- [ ] Use `snake_case` titles, `~/path` nav, `//` subtitle comments, `> ` empty states
- [ ] Keep corners square; use 1px `border-border` everywhere
- [ ] Apply semantic green/red only to money values and errors
- [ ] Add framer-motion entrance on main content and sidebar
- [ ] Style Recharts with monochrome palette and dark tooltips
- [ ] Add `animate-glow-pulse` to one focal card per view (optional but on-brand)

---

## What to avoid

- Sans-serif fonts or rounded UI (Material, iOS-style cards)
- Light mode or theme switcher (breaks the terminal identity)
- Heavy shadows or gradients (except subtle white glow on focus/hover)
- Title Case labels — use lowercase/`snake_case`
- Colorful charts — stay in the gray → white ramp
- Replacing borders with background-only elevation

---

*Generated from the money-management codebase. Update this doc if tokens or primitives change.*
