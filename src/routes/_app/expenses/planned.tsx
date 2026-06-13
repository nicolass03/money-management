import { createFileRoute, Link } from "@tanstack/react-router";
import { PlannedExpenses } from "@/components/expenses/planned-expenses";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useMoneyContext, usePlannedExpenses } from "@/hooks/use-queries";

export const Route = createFileRoute("/_app/expenses/planned")({
  component: PlannedExpensesPage,
});

function PlannedExpensesPage() {
  const planned = usePlannedExpenses();
  const money = useMoneyContext();

  if (planned.isLoading || money.isLoading || !money.data) {
    return <LoadingIndicator label="fetching data" />;
  }

  return (
    <div>
      <Link
        to="/expenses"
        className="mb-6 inline-block font-mono text-sm text-accent hover:text-accent-glow"
      >
        {"< back to ~/expenses"}
      </Link>

      <PlannedExpenses
        plannedExpenses={planned.data ?? []}
        displayCurrency={money.data.displayCurrency}
        rates={money.data.rates}
      />
    </div>
  );
}
