import { createFileRoute } from "@tanstack/react-router";
import { ProjectionsDashboard } from "@/components/projections/projections-dashboard";
import {
  useMoneyContext,
  useProjections,
  useSettings,
} from "@/hooks/use-queries";
import { ApiError } from "@/lib/api/client";
import type { ExchangeRates } from "@/lib/currency/convert";
import type { CurrencyCode } from "@/lib/types/constants";

export const Route = createFileRoute("/_app/projections")({
  component: ProjectionsPage,
});

function ProjectionsPage() {
  const settings = useSettings();
  const money = useMoneyContext();
  const hasSchedule = !!settings.data?.primaryScheduleId;
  const projections = useProjections(hasSchedule);

  const displayCurrency: CurrencyCode =
    money.data?.displayCurrency ??
    settings.data?.displayCurrency ??
    "usd";
  const rates: ExchangeRates =
    money.data?.rates ?? { base: "USD", rates: {}, fetchedAt: "" };

  const settingsLoading = settings.isLoading || money.isLoading;
  const projectionsLoading = hasSchedule && projections.isLoading;

  if (
    !settingsLoading &&
    hasSchedule &&
    projections.error instanceof ApiError &&
    projections.error.status === 400
  ) {
    return (
      <ProjectionsDashboard
        rows={[]}
        primarySchedule={null}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    );
  }

  if (!settingsLoading && hasSchedule && projections.error) {
    throw projections.error;
  }

  return (
    <ProjectionsDashboard
      rows={projections.data?.rows ?? []}
      primarySchedule={
        projections.data?.primarySchedule ??
        settings.data?.primarySchedule ??
        null
      }
      hasSchedule={hasSchedule}
      displayCurrency={displayCurrency}
      rates={rates}
      settingsLoading={settingsLoading}
      projectionsLoading={projectionsLoading}
    />
  );
}
