// Theme registry — the single source of truth for selectable themes.
//
// Adding a new theme is a frontend-only change: append one `ThemeDefinition` to `THEMES`.
// The chosen theme's `code` is the only thing persisted server-side (on user_settings).
//
// `tokens` is `Record<ThemeMode, ThemeTokens>` so every theme MUST define a complete token set
// for both light and dark — omitting either mode, or any individual token, is a compile error.

export type ThemeMode = "light" | "dark";

// CSS custom-property names WITHOUT the leading "--". These map onto the runtime variables that
// `@theme inline` in globals.css bridges into Tailwind utilities (e.g. `bg-surface`, `text-text`).
export type ThemeTokenKey =
  | "bg"
  | "surface"
  | "surface-elevated"
  | "border"
  | "text"
  | "muted"
  | "accent"
  | "accent-glow"
  | "success"
  | "warning"
  | "danger"
  | "scanline-color"
  | "glow-color"
  | "glow-pulse-color"
  | "font-base";

export type ThemeTokens = Record<ThemeTokenKey, string>;

export interface ThemeDefinition {
  /** Stable identifier persisted to user_settings.theme. */
  code: string;
  /** i18n key (in the `settings` namespace) for the display name. */
  nameKey: string;
  tokens: Record<ThemeMode, ThemeTokens>;
}

const TERMINAL: ThemeDefinition = {
  code: "terminal",
  nameKey: "themeTerminal",
  tokens: {
    dark: {
      bg: "#0a0a0a",
      surface: "#141414",
      "surface-elevated": "#1a1a1a",
      border: "#2a2a2a",
      text: "#e8e8e8",
      muted: "#6b6b6b",
      accent: "#d4d4d4",
      "accent-glow": "#ffffff",
      success: "#a3e635",
      warning: "#facc15",
      danger: "#f87171",
      "scanline-color": "rgba(0, 0, 0, 0.03)",
      "glow-color": "rgba(255, 255, 255, 0.12)",
      "glow-pulse-color": "rgba(255, 255, 255, 0.08)",
      "font-base": '"JetBrains Mono", ui-monospace, monospace',
    },
    light: {
      bg: "#f7f7f7",
      surface: "#ffffff",
      "surface-elevated": "#f0f0f0",
      border: "#e0e0e0",
      text: "#171717",
      muted: "#737373",
      accent: "#404040",
      "accent-glow": "#0a0a0a",
      success: "#4d7c0f",
      warning: "#b45309",
      danger: "#f87171",
      "scanline-color": "rgba(0, 0, 0, 0.015)",
      "glow-color": "rgba(0, 0, 0, 0.08)",
      "glow-pulse-color": "rgba(0, 0, 0, 0.06)",
      "font-base": '"JetBrains Mono", ui-monospace, monospace',
    },
  },
};

export const THEMES: ThemeDefinition[] = [TERMINAL];

export const DEFAULT_THEME_CODE = TERMINAL.code;

export function getTheme(code: string | undefined | null): ThemeDefinition {
  return THEMES.find((theme) => theme.code === code) ?? THEMES[0];
}

export function isThemeCode(code: string): boolean {
  return THEMES.some((theme) => theme.code === code);
}
