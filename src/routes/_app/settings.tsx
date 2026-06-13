import { createFileRoute } from "@tanstack/react-router";
import { CurrencySettings } from "@/components/settings/currency-settings";
import { ExtraExpenseSettings } from "@/components/settings/extra-expense-settings";
import { ProjectionSettings } from "@/components/settings/projection-settings";
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
  const schedules = useIncomeSchedules();
  const settings = useSettings();
  const money = useMoneyContext();

  if (schedules.isLoading || settings.isLoading || money.isLoading || !settings.data || !money.data) {
    return <LoadingIndicator label="fetching data" />;
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="settings"
        subtitle="configure app preferences"
        className="mb-6"
      />

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

      <ExtraExpenseSettings
        extraExpenseLimit={settings.data.extraExpenseLimit}
        extraExpenseLimitCurrency={settings.data.extraExpenseLimitCurrency}
        displayCurrency={settings.data.displayCurrency}
      />
    </div>
  );
}
