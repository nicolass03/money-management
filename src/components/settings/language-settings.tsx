import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useUpdateLanguage } from "@/lib/mutations/settings";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { AppLanguage } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

interface LanguageSettingsProps {
  language: AppLanguage;
}

export function LanguageSettings({ language }: LanguageSettingsProps) {
  const { t } = useTranslation("settings");
  const updateLanguage = useUpdateLanguage();
  const { setLanguage } = useLanguage();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    const selected = String(formData.get("language") ?? "en");
    const nextLanguage: AppLanguage = selected === "es" ? "es" : "en";
    await setLanguage(nextLanguage);
    const result = await updateLanguage.mutateAsync(nextLanguage);
    if (result.success) setSuccess(true);
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("languageTitle")}
        subtitle={t("languageSubtitle")}
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="language"
              className="mb-2 block font-mono text-xs text-muted"
            >
              {t("languageLabel")}
            </label>
            <select
              id="language"
              name="language"
              defaultValue={language}
              className={cn(
                "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent",
              )}
            >
              <option value="en">{t("english")}</option>
              <option value="es">{t("spanish")}</option>
            </select>
          </div>

          {updateLanguage.data?.error && (
            <p className="font-mono text-xs text-danger">
              {updateLanguage.data.error}
            </p>
          )}
          {success && (
            <p className="font-mono text-xs text-success">
              {t("languageUpdated")}
            </p>
          )}

          <Button type="submit" loading={updateLanguage.isPending}>
            {updateLanguage.isPending ? t("saving", { ns: "common" }) : t("saveLanguage")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
