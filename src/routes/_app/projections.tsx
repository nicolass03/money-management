import { createFileRoute } from "@tanstack/react-router";
import { ProjectionsDashboard } from "@/components/projections/projections-dashboard";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  useMoneyContext,
  useProjections,
  useSettings,
} from "@/hooks/use-queries";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/_app/projections")({
  component: ProjectionsPage,
});

function ProjectionsPage() {
  const settings = useSettings();
  const money = useMoneyContext();
  const hasSchedule = !!settings.data?.primaryScheduleId;
  const projections = useProjections(hasSchedule);

  if (settings.isLoading || money.isLoading || !money.data) {
    return <LoadingIndicator label="fetching data" />;
  }

  const emptyProps = {
    rows: [] as const,
    primarySchedule: null,
    displayCurrency: money.data.displayCurrency,
    rates: money.data.rates,
  };

  if (!hasSchedule) {
    return <ProjectionsDashboard {...emptyProps} rows={[]} />;
  }

  if (projections.isLoading) {
    return <LoadingIndicator label="fetching data" />;
  }

  if (projections.error instanceof ApiError && projections.error.status === 400) {
    return <ProjectionsDashboard {...emptyProps} rows={[]} />;
  }

  if (projections.error) {
    throw projections.error;
  }

  const data = projections.data!;

  return (
    <ProjectionsDashboard
      rows={data.rows}
      primarySchedule={data.primarySchedule}
      displayCurrency={data.displayCurrency}
      rates={data.rates}
    />
  );
}
