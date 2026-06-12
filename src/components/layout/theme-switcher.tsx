"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const THEME_CYCLE = ["dark", "light", "system"] as const;

function themeLabel(theme: string | undefined, resolvedTheme: string | undefined) {
  if (theme === "system") {
    return `theme: system (${resolvedTheme ?? "…"})`;
  }
  return `theme: ${theme ?? "dark"}`;
}

export function ThemeSwitcher({ className }: { className?: string }) {
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
      aria-label="Cycle theme: dark, light, or system"
      aria-pressed={mounted ? theme === "light" : false}
      disabled={!mounted}
    >
      {mounted ? themeLabel(theme, resolvedTheme) : "theme: …"}
    </Button>
  );
}
