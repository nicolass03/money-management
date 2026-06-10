export const dynamic = "force-dynamic";

import { ExpenseDashboard } from "@/components/expenses/expense-dashboard";
import {
  getAllTagNames,
  getExpensesWithTags,
  getIncomePayScheduleById,
  getMoneyContext,
  getPlannedExpensesWithTags,
  getRecurringExpensesWithTags,
  getUserSettings,
} from "@/lib/db/queries";
import { getCurrentPeriodExpenses } from "@/lib/projections/build-projection";
import { getUpcomingPayableItems } from "@/lib/projections/upcoming-payable";

export default async function ExpensesPage() {
  const [allExpenses, recurringExpenses, plannedExpenses, allTags, settings, money] =
    await Promise.all([
      getExpensesWithTags(),
      getRecurringExpensesWithTags(),
      getPlannedExpensesWithTags(),
      getAllTagNames(),
      getUserSettings(),
      getMoneyContext(),
    ]);

  const primarySchedule = settings.primaryScheduleId
    ? await getIncomePayScheduleById(settings.primaryScheduleId)
    : null;

  const periodData = primarySchedule
    ? getCurrentPeriodExpenses({
        primarySchedule,
        expenses: allExpenses,
        recurringExpenses,
        plannedExpenses,
        displayCurrency: money.displayCurrency,
        rates: money.rates,
      })
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
      periodData={periodData}
      upcomingPayableItems={upcomingPayableItems}
      displayCurrency={money.displayCurrency}
      rates={money.rates}
    />
  );
}
