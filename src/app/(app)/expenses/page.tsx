export const dynamic = "force-dynamic";

import { ExpenseDashboard } from "@/components/expenses/expense-dashboard";
import {
  getAllTagNames,
  getBudgetsWithTags,
  getExpensesWithTags,
  getIncomePayScheduleById,
  getMoneyContext,
  getPlannedExpensesWithTags,
  getRecurringExpensesWithTags,
  getUserSettings,
} from "@/lib/db/queries";
import { getUpcomingPayableItems } from "@/lib/projections/upcoming-payable";

export default async function ExpensesPage() {
  const [allExpenses, recurringExpenses, plannedExpenses, budgets, allTags, settings, money] =
    await Promise.all([
      getExpensesWithTags(),
      getRecurringExpensesWithTags(),
      getPlannedExpensesWithTags(),
      getBudgetsWithTags(),
      getAllTagNames(),
      getUserSettings(),
      getMoneyContext(),
    ]);

  const primarySchedule = settings.primaryScheduleId
    ? await getIncomePayScheduleById(settings.primaryScheduleId)
    : null;

  const upcomingPayableItems = getUpcomingPayableItems({
    expenses: allExpenses,
    recurringExpenses,
    plannedExpenses,
  });

  return (
    <ExpenseDashboard
      allExpenses={allExpenses}
      allTags={allTags}
      primarySchedule={primarySchedule}
      recurringExpenses={recurringExpenses}
      plannedExpenses={plannedExpenses}
      budgets={budgets}
      upcomingPayableItems={upcomingPayableItems}
      displayCurrency={money.displayCurrency}
      rates={money.rates}
    />
  );
}
