export const dynamic = "force-dynamic";

import { BudgetsSection } from "@/components/budgets/budgets-section";
import { getBudgetExpenses, getBudgets } from "@/lib/api/budgets";
import { getMoneyContext } from "@/lib/api/money-context";
import type { ExpenseWithTags } from "@/lib/types/domain";

export default async function BudgetsPage() {
  const [budgets, money] = await Promise.all([
    getBudgets(),
    getMoneyContext(),
  ]);

  const budgetExpenses: Record<string, ExpenseWithTags[]> = {};
  await Promise.all(
    budgets.map(async (budget) => {
      budgetExpenses[budget.id] = await getBudgetExpenses(budget.id);
    }),
  );

  return (
    <BudgetsSection
      budgets={budgets}
      budgetExpenses={budgetExpenses}
      displayCurrency={money.displayCurrency}
      rates={money.rates}
    />
  );
}
