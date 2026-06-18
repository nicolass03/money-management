import { useTheme } from "next-themes";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useUpdateTheme } from "@/lib/mutations/settings";
import { useThemeManager } from "@/lib/theme/theme-manager";
import {
  type ThemeDefinition,
  type ThemeMode,
  THEMES,
} from "@/lib/theme/themes";
import { cn } from "@/lib/utils";

interface ThemeSettingsProps {
  theme: string;
}

// Token keys shown in the small preview swatch for each theme.
const SWATCH_KEYS = ["bg", "surface", "accent", "text"] as const;

export function ThemeSettings({ theme }: ThemeSettingsProps) {
  const { t } = useTranslation("settings");
  const { resolvedTheme } = useTheme();
  const mode: ThemeMode = resolvedTheme === "light" ? "light" : "dark";
  const updateTheme = useUpdateTheme();
  const { themeCode, setTheme } = useThemeManager();
  const [success, setSuccess] = useState(false);

  // Prefer the live manager state; fall back to the server value on first render.
  const active = themeCode || theme;

  async function handleSelect(code: string) {
    if (code === active) return;
    setSuccess(false);
    await setTheme(code);
    const result = await updateTheme.mutateAsync(code);
    if (result.success) setSuccess(true);
  }

  return (
    <div className="space-y-4">
      <SectionHeader title={t("themeTitle")} subtitle={t("themeSubtitle")} />
      <Card>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {THEMES.map((option) => (
              <ThemeOption
                key={option.code}
                theme={option}
                mode={mode}
                active={option.code === active}
                disabled={updateTheme.isPending}
                label={t(option.nameKey)}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {updateTheme.data?.error && (
            <p className="font-mono text-xs text-danger">
              {updateTheme.data.error}
            </p>
          )}
          {success && (
            <p className="font-mono text-xs text-success">{t("themeUpdated")}</p>
          )}
        </div>
      </Card>
    </div>
  );
}

interface ThemeOptionProps {
  theme: ThemeDefinition;
  mode: ThemeMode;
  active: boolean;
  disabled: boolean;
  label: string;
  onSelect: (code: string) => void;
}

function ThemeOption({
  theme,
  mode,
  active,
  disabled,
  label,
  onSelect,
}: ThemeOptionProps) {
  const tokens = theme.tokens[mode];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(theme.code)}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 border px-3 py-2 text-left transition-colors disabled:opacity-50",
        active
          ? "border-accent bg-accent/10"
          : "border-border bg-surface hover:border-accent/40",
      )}
    >
      <span className="flex shrink-0 overflow-hidden border border-border">
        {SWATCH_KEYS.map((key) => (
          <span
            key={key}
            className="h-6 w-3"
            style={{ background: tokens[key] }}
          />
        ))}
      </span>
      <span className="flex-1 font-mono text-sm text-text">{label}</span>
      {active && <span className="font-mono text-xs text-accent">[✓]</span>}
    </button>
  );
}
