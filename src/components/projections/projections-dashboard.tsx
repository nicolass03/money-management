import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ProjectionsTableSkeleton } from "@/components/ui/list-skeletons";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { IncomePaySchedule } from "@/lib/types/domain";
import type { ProjectionRow } from "@/lib/projections/build-projection";
import { ProjectionsTable } from "./projections-table";

interface ProjectionsDashboardProps extends MoneyDisplayContext {
  rows: ProjectionRow[];
  primarySchedule: IncomePaySchedule | null;
  hasSchedule?: boolean;
  settingsLoading?: boolean;
  projectionsLoading?: boolean;
}

export function ProjectionsDashboard({
  rows,
  primarySchedule,
  hasSchedule = !!primarySchedule,
  settingsLoading = false,
  projectionsLoading = false,
  displayCurrency,
  rates,
}: ProjectionsDashboardProps) {
  const { t } = useTranslation("projections");
  const awaitingSettings = settingsLoading;
  const awaitingProjections =
    !settingsLoading && hasSchedule && (projectionsLoading || !primarySchedule);

  return (
    <div>
      <SectionHeader
        title={t("title")}
        subtitle={t("subtitle")}
        className="mb-6"
      />

      {awaitingSettings ? (
        <div className="space-y-4">
          <Skeleton className="h-3 w-72" />
          <ProjectionsTableSkeleton />
        </div>
      ) : !hasSchedule ? (
        <Card>
          <p className="font-mono text-sm text-muted">
            {t("noSchedule")}
          </p>
          <Link
            to="/settings"
            className="mt-3 inline-block font-mono text-sm text-accent hover:text-accent-glow"
          >
            {t("configureInSettings")}
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {primarySchedule ? (
            <p className="font-mono text-xs text-muted">
              {t("scheduleMeta", {
                name: primarySchedule.name,
                currency: displayCurrency.toUpperCase(),
              })}
            </p>
          ) : (
            <Skeleton className="h-3 w-72" />
          )}
          {awaitingProjections ? (
            <ProjectionsTableSkeleton />
          ) : (
            <ProjectionsTable
              rows={rows}
              displayCurrency={displayCurrency}
              rates={rates}
            />
          )}
        </div>
      )}
    </div>
  );
}
