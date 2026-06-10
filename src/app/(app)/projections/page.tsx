export const dynamic = "force-dynamic";

import { ProjectionsDashboard } from "@/components/projections/projections-dashboard";
import {
  getExpensesWithTags,
  getIncome,
  getIncomePayScheduleById,
  getMoneyContext,
  getRecurringExpensesWithTags,
  getUserSettings,
} from "@/lib/db/queries";
import { buildProjectionRows } from "@/lib/projections/build-projection";

export default async function ProjectionsPage() {
  const [settings, money, incomeEntries, expenses, recurringExpenses] =
    await Promise.all([
      getUserSettings(),
      getMoneyContext(),
      getIncome(),
      getExpensesWithTags(),
      getRecurringExpensesWithTags(),
    ]);

  const primarySchedule = settings.primaryScheduleId
    ? await getIncomePayScheduleById(settings.primaryScheduleId)
    : null;

  const rows = primarySchedule
    ? buildProjectionRows({
        primarySchedule,
        incomeEntries,
        expenses,
        recurringExpenses,
        displayCurrency: money.displayCurrency,
        rates: money.rates,
        initialFreeMoney: settings.projectionInitialFreeMoney,
        projectionStartDate: settings.projectionStartDate,
      })
    : [];

  return (
    <ProjectionsDashboard
      rows={rows}
      primarySchedule={primarySchedule}
      displayCurrency={money.displayCurrency}
      rates={money.rates}
    />
  );
}
