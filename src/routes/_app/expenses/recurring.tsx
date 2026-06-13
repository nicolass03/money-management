import { createFileRoute, Link } from "@tanstack/react-router";
import { RecurringExpenses } from "@/components/expenses/recurring-expenses";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  useMoneyContext,
  useRecurringExpenses,
  useTags,
} from "@/hooks/use-queries";

export const Route = createFileRoute("/_app/expenses/recurring")({
  component: RecurringExpensesPage,
});

function RecurringExpensesPage() {
  const recurring = useRecurringExpenses();
  const tags = useTags();
  const money = useMoneyContext();

  if (recurring.isLoading || tags.isLoading || money.isLoading || !money.data) {
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

      <RecurringExpenses
        recurringExpenses={recurring.data ?? []}
        allTags={tags.data ?? []}
        displayCurrency={money.data.displayCurrency}
        rates={money.data.rates}
      />
    </div>
  );
}
