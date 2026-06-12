export const dynamic = "force-dynamic";

import { ProjectionsDashboard } from "@/components/projections/projections-dashboard";
import { ApiError } from "@/lib/api/client";
import { getMoneyContext } from "@/lib/api/money-context";
import { getProjectionsFromApi } from "@/lib/api/projections";
import { getUserSettingsFromApi } from "@/lib/api/settings";

export default async function ProjectionsPage() {
  const [settings, money] = await Promise.all([
    getUserSettingsFromApi(),
    getMoneyContext(),
  ]);

  if (!settings.primaryScheduleId) {
    return (
      <ProjectionsDashboard
        rows={[]}
        primarySchedule={null}
        displayCurrency={money.displayCurrency}
        rates={money.rates}
      />
    );
  }

  try {
    const projections = await getProjectionsFromApi();
    return (
      <ProjectionsDashboard
        rows={projections.rows}
        primarySchedule={projections.primarySchedule}
        displayCurrency={projections.displayCurrency}
        rates={projections.rates}
      />
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      return (
        <ProjectionsDashboard
          rows={[]}
          primarySchedule={null}
          displayCurrency={money.displayCurrency}
          rates={money.rates}
        />
      );
    }
    throw error;
  }
}
