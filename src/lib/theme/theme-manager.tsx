"use client";

import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSettings } from "@/hooks/use-queries";
import { useSession } from "@/lib/auth/session-store";
import {
  DEFAULT_THEME_CODE,
  getTheme,
  type ThemeMode,
} from "@/lib/theme/themes";

const THEME_STORAGE_KEY = "incm-mgmt-theme";

function getStoredTheme(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(THEME_STORAGE_KEY);
}

function storeTheme(code: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, code);
}

/**
 * Writes the active theme's tokens onto the document root as CSS variables. Inline styles
 * override the `:root` fallback in globals.css, and Tailwind utilities keep working because
 * `@theme inline` resolves to these same `--*` names. `colorScheme` mirrors the mode.
 */
function applyTheme(code: string, mode: ThemeMode) {
  const tokens = getTheme(code).tokens[mode];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(`--${key}`, value);
  }
  root.style.colorScheme = mode;
  root.dataset.theme = code;
}

interface ThemeManagerContextValue {
  themeCode: string;
  setTheme: (code: string) => Promise<void>;
}

const ThemeManagerContext = createContext<ThemeManagerContextValue | null>(null);

export function ThemeManagerProvider({ children }: { children: React.ReactNode }) {
  const { canAccessApp } = useSession();
  const settings = useSettings(canAccessApp);
  // `resolvedTheme` is the orthogonal light/dark mode owned by next-themes.
  const { resolvedTheme } = useTheme();
  const mode: ThemeMode = resolvedTheme === "light" ? "light" : "dark";

  const [themeCode, setThemeCode] = useState<string>(() => {
    return getStoredTheme() ?? DEFAULT_THEME_CODE;
  });

  // Re-apply whenever the selected theme or the resolved light/dark mode changes.
  useEffect(() => {
    applyTheme(themeCode, mode);
  }, [themeCode, mode]);

  // The server is the source of truth once the user can access the app.
  useEffect(() => {
    if (!canAccessApp || !settings.data?.theme) return;
    const fromApi = settings.data.theme;
    if (fromApi !== themeCode) {
      setThemeCode(fromApi);
      storeTheme(fromApi);
    }
  }, [canAccessApp, themeCode, settings.data?.theme]);

  async function setTheme(code: string) {
    setThemeCode(code);
    storeTheme(code);
    applyTheme(code, mode);
  }

  const value = useMemo(() => ({ themeCode, setTheme }), [themeCode]);

  return (
    <ThemeManagerContext.Provider value={value}>
      {children}
    </ThemeManagerContext.Provider>
  );
}

export function useThemeManager() {
  const context = useContext(ThemeManagerContext);
  if (!context) {
    throw new Error("useThemeManager must be used within ThemeManagerProvider");
  }
  return context;
}
