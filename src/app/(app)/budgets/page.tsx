export const dynamic = "force-dynamic";

import { BudgetsSection } from "@/components/budgets/budgets-section";
import {
  getBudgetExpenses,
  getBudgetsWithTags,
  getMoneyContext,
} from "@/lib/db/queries";
import type { ExpenseWithTags } from "@/lib/db/schema";

export default async function BudgetsPage() {
  const [budgets, money] = await Promise.all([
    getBudgetsWithTags(),
    getMoneyContext(),
  ]);

  const budgetExpenses: Record<number, ExpenseWithTags[]> = {};
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
