import { createFileRoute } from "@tanstack/react-router";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  return <ReportsDashboard />;
}
