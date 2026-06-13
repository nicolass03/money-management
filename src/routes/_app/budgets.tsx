import { createFileRoute } from "@tanstack/react-router";
import { BudgetsSection } from "@/components/budgets/budgets-section";
import { useAllBudgetExpenses, useBudgets, useMoneyContext } from "@/hooks/use-queries";
import type { ExchangeRates } from "@/lib/currency/convert";
import type { CurrencyCode } from "@/lib/types/constants";

export const Route = createFileRoute("/_app/budgets")({
  component: BudgetsPage,
});

function BudgetsPage() {
  const budgets = useBudgets();
  const money = useMoneyContext();
  const budgetIds = (budgets.data ?? []).map((b) => b.id);
  const budgetExpensesQuery = useAllBudgetExpenses(budgetIds);

  const displayCurrency: CurrencyCode = money.data?.displayCurrency ?? "usd";
  const rates: ExchangeRates =
    money.data?.rates ?? { base: "USD", rates: {}, fetchedAt: "" };

  return (
    <BudgetsSection
      budgets={budgets.data ?? []}
      budgetExpenses={budgetExpensesQuery.data ?? {}}
      budgetsLoading={budgets.isLoading || money.isLoading}
      expensesLoading={budgetExpensesQuery.isLoading && budgetIds.length > 0}
      displayCurrency={displayCurrency}
      rates={rates}
    />
  );
}
