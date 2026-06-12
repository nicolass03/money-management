export const dynamic = "force-dynamic";

import { ExpenseDashboard } from "@/components/expenses/expense-dashboard";
import { getBudgets } from "@/lib/api/budgets";
import { getExpenses } from "@/lib/api/expenses";
import { getIncomeScheduleById } from "@/lib/api/income-schedules";
import { getMoneyContext } from "@/lib/api/money-context";
import { getPlannedExpenses } from "@/lib/api/planned-expenses";
import { getRecurringExpenses } from "@/lib/api/recurring-expenses";
import { getUserSettingsFromApi } from "@/lib/api/settings";
import { getAllTagNames } from "@/lib/api/tags";
import { getUpcomingPayableItems } from "@/lib/projections/upcoming-payable";

export default async function ExpensesPage() {
  const [allExpenses, recurringExpenses, plannedExpenses, budgets, allTags, settings, money] =
    await Promise.all([
      getExpenses(),
      getRecurringExpenses(),
      getPlannedExpenses(),
      getBudgets(),
      getAllTagNames(),
      getUserSettingsFromApi(),
      getMoneyContext(),
    ]);

  const primarySchedule = settings.primaryScheduleId
    ? await getIncomeScheduleById(settings.primaryScheduleId)
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
