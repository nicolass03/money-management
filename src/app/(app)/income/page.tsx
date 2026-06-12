export const dynamic = "force-dynamic";

import { IncomeDashboard } from "@/components/income/income-dashboard";
import { getIncome } from "@/lib/api/income";
import { getIncomeSchedules } from "@/lib/api/income-schedules";
import { getMoneyContext } from "@/lib/api/money-context";

export default async function IncomePage() {
  const [entries, schedules, money] = await Promise.all([
    getIncome(),
    getIncomeSchedules(),
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
