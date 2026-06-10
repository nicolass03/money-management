import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { IncomePaySchedule } from "@/lib/db/schema";
import type { ProjectionRow } from "@/lib/projections/build-projection";
import { ProjectionsTable } from "./projections-table";

interface ProjectionsDashboardProps extends MoneyDisplayContext {
  rows: ProjectionRow[];
  primarySchedule: IncomePaySchedule | null;
}

export function ProjectionsDashboard({
  rows,
  primarySchedule,
  displayCurrency,
  rates,
}: ProjectionsDashboardProps) {
  return (
    <div>
      <SectionHeader
        title="projections"
        subtitle="cash flow by pay period for the next 7 months — planned spend and running free money"
        className="mb-6"
      />

      {!primarySchedule ? (
        <Card>
          <p className="font-mono text-sm text-muted">
            {"> no primary pay schedule configured."}
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-block font-mono text-sm text-accent hover:text-accent-glow"
          >
            configure in ~/settings
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="font-mono text-xs text-muted">
            periods based on {primarySchedule.name} {"//"} displaying in{" "}
            {displayCurrency.toUpperCase()}
          </p>
          <ProjectionsTable
            rows={rows}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </div>
      )}
    </div>
  );
}
