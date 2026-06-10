export const dynamic = "force-dynamic";

import { ExpenseDashboard } from "@/components/expenses/expense-dashboard";
import {
  getAllTagNames,
  getExpensesWithTags,
  getIncomePayScheduleById,
  getMoneyContext,
  getRecurringExpensesWithTags,
  getUserSettings,
} from "@/lib/db/queries";
import { getCurrentPeriodExpenses } from "@/lib/projections/build-projection";

export default async function ExpensesPage() {
  const [allExpenses, recurringExpenses, allTags, settings, money] =
    await Promise.all([
      getExpensesWithTags(),
      getRecurringExpensesWithTags(),
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
        displayCurrency: money.displayCurrency,
        rates: money.rates,
      })
    : null;

  return (
    <ExpenseDashboard
      allExpenses={allExpenses}
      allTags={allTags}
      primarySchedule={primarySchedule}
      periodData={periodData}
      displayCurrency={money.displayCurrency}
      rates={money.rates}
    />
  );
}
