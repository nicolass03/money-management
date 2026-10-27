import { createFileRoute } from "@tanstack/react-router";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { defaultReportRange, type ReportDateRange } from "@/lib/reports/date-range";

/** `""` is kept (a cleared date input) so validation can report it instead of snapping back. */
function searchDate(value: unknown): string | undefined {
  return typeof value === "string" && (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value))
    ? value
    : undefined;
}

export const Route = createFileRoute("/_app/reports")({
  // The range lives in the URL so a reload or a shared link keeps it.
  validateSearch: (search: Record<string, unknown>): Partial<ReportDateRange> => ({
    from: searchDate(search.from),
    to: searchDate(search.to),
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const fallback = defaultReportRange();
  const range: ReportDateRange = {
    from: search.from ?? fallback.from,
    to: search.to ?? fallback.to,
  };

  return (
    <ReportsDashboard
      range={range}
      onRangeChange={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
