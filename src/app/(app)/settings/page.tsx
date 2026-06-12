export const dynamic = "force-dynamic";

import { CurrencySettings } from "@/components/settings/currency-settings";
import { ProjectionSettings } from "@/components/settings/projection-settings";
import { SectionHeader } from "@/components/ui/section-header";
import { getIncomeSchedules } from "@/lib/api/income-schedules";
import { getMoneyContext } from "@/lib/api/money-context";
import { getUserSettingsFromApi } from "@/lib/api/settings";

export default async function SettingsPage() {
  const [schedules, settings, money] = await Promise.all([
    getIncomeSchedules(),
    getUserSettingsFromApi(),
    getMoneyContext(),
  ]);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="settings"
        subtitle="configure app preferences"
        className="mb-6"
      />

      <CurrencySettings
        displayCurrency={settings.displayCurrency}
        rates={money.rates}
      />

      <ProjectionSettings
        schedules={schedules}
        primaryScheduleId={settings.primaryScheduleId}
        projectionInitialFreeMoney={settings.projectionInitialFreeMoney}
        projectionStartDate={settings.projectionStartDate}
        displayCurrency={settings.displayCurrency}
      />
    </div>
  );
}
