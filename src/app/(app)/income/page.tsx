export const dynamic = "force-dynamic";

import { IncomeDashboard } from "@/components/income/income-dashboard";
import { getIncome, getIncomePaySchedules, getMoneyContext } from "@/lib/db/queries";

export default async function IncomePage() {
  const [entries, schedules, money] = await Promise.all([
    getIncome(),
    getIncomePaySchedules(),
    getMoneyContext(),
  ]);

  return (
    <IncomeDashboard
      entries={entries}
      schedules={schedules}
      displayCurrency={money.displayCurrency}
      rates={money.rates}
    />
  );
}
