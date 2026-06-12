export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { ProjectionsDashboard } from "@/components/projections/projections-dashboard";
import { ApiError } from "@/lib/api/client";
import { getMoneyContext } from "@/lib/api/money-context";
import {
  getProjectionsFromApi,
  type ProjectionsResponse,
} from "@/lib/api/projections";
import { getUserSettingsFromApi } from "@/lib/api/settings";

export default async function ProjectionsPage() {
  const [settings, money] = await Promise.all([
    getUserSettingsFromApi(),
    getMoneyContext(),
  ]);

  const emptyProps = {
    rows: [] as ProjectionsResponse["rows"],
    primarySchedule: null,
    displayCurrency: money.displayCurrency,
    rates: money.rates,
  };

  if (!settings.primaryScheduleId) {
    return <ProjectionsDashboard {...emptyProps} />;
  }

  let projections: ProjectionsResponse;
  try {
    projections = await getProjectionsFromApi();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    if (error instanceof ApiError && error.status === 400) {
      return <ProjectionsDashboard {...emptyProps} />;
    }
    throw error;
  }

  return (
    <ProjectionsDashboard
      rows={projections.rows}
      primarySchedule={projections.primarySchedule}
      displayCurrency={projections.displayCurrency}
      rates={projections.rates}
    />
  );
}
