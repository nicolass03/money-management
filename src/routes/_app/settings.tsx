import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CurrencySettings } from "@/components/settings/currency-settings";
import { ExtraSpentSettings } from "@/components/settings/extra-spent-settings";
import { LanguageSettings } from "@/components/settings/language-settings";
import { ProjectionSettings } from "@/components/settings/projection-settings";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { SectionHeader } from "@/components/ui/section-header";
import {
  useIncomeSchedules,
  useMoneyContext,
  useSettings,
} from "@/hooks/use-queries";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation(["settings", "common"]);
  const schedules = useIncomeSchedules();
  const settings = useSettings();
  const money = useMoneyContext();

  if (schedules.isLoading || settings.isLoading || money.isLoading || !settings.data || !money.data) {
    return <LoadingIndicator label={t("common:fetchingData")} />;
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title={t("settings:title")}
        subtitle={t("settings:subtitle")}
        className="mb-6"
      />

      <LanguageSettings language={settings.data.language} />

      <ThemeSettings theme={settings.data.theme} />

      <CurrencySettings
        displayCurrency={settings.data.displayCurrency}
        rates={money.data.rates}
      />

      <ProjectionSettings
        schedules={schedules.data ?? []}
        primaryScheduleId={settings.data.primaryScheduleId}
        projectionInitialFreeMoney={settings.data.projectionInitialFreeMoney}
        projectionStartDate={settings.data.projectionStartDate}
        displayCurrency={settings.data.displayCurrency}
      />

      <ExtraSpentSettings
        extraSpentLimit={settings.data.extraSpentLimit}
        displayCurrency={settings.data.displayCurrency}
      />
    </div>
  );
}
