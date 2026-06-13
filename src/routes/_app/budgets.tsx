import { createFileRoute } from "@tanstack/react-router";
import { BudgetsSection } from "@/components/budgets/budgets-section";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useAllBudgetExpenses, useBudgets, useMoneyContext } from "@/hooks/use-queries";

export const Route = createFileRoute("/_app/budgets")({
  component: BudgetsPage,
});

function BudgetsPage() {
  const budgets = useBudgets();
  const money = useMoneyContext();
  const budgetIds = (budgets.data ?? []).map((b) => b.id);
  const budgetExpensesQuery = useAllBudgetExpenses(budgetIds);

  if (budgets.isLoading || money.isLoading || budgetExpensesQuery.isLoading || !money.data) {
    return <LoadingIndicator label="fetching data" />;
  }

  return (
    <BudgetsSection
      budgets={budgets.data ?? []}
      budgetExpenses={budgetExpensesQuery.data ?? {}}
      displayCurrency={money.data.displayCurrency}
      rates={money.data.rates}
    />
  );
}
