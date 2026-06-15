"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const THEME_CYCLE = ["dark", "light", "system"] as const;

function themeLabel(
  theme: string | undefined,
  resolvedTheme: string | undefined,
  t: (key: string, options?: Record<string, string>) => string,
) {
  if (theme === "system") {
    return t("themeSystem", { resolved: resolvedTheme ?? "..." });
  }
  if (theme === "light") return t("themeLight");
  return t("themeDark");
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function cycleTheme() {
    const current = theme ?? "dark";
    const index = THEME_CYCLE.indexOf(current as (typeof THEME_CYCLE)[number]);
    const next = THEME_CYCLE[(index + 1) % THEME_CYCLE.length];
    setTheme(next);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={cycleTheme}
      aria-label={t("themeAriaLabel")}
      aria-pressed={mounted ? theme === "light" : false}
      disabled={!mounted}
    >
      {mounted ? themeLabel(theme, resolvedTheme, t) : t("themeLoading")}
    </Button>
  );
}
