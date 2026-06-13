import { createFileRoute } from "@tanstack/react-router";
import { IncomeDashboard } from "@/components/income/income-dashboard";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  useIncome,
  useIncomeSchedules,
  useMoneyContext,
} from "@/hooks/use-queries";

export const Route = createFileRoute("/_app/income")({
  component: IncomePage,
});

function IncomePage() {
  const entries = useIncome();
  const schedules = useIncomeSchedules();
  const money = useMoneyContext();

  if (entries.isLoading || schedules.isLoading || money.isLoading || !money.data) {
    return <LoadingIndicator label="fetching data" />;
  }

  return (
    <IncomeDashboard
      entries={entries.data ?? []}
      schedules={schedules.data ?? []}
      displayCurrency={money.data.displayCurrency}
      rates={money.data.rates}
    />
  );
}
