import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { CurrentPeriodExpenses } from "./current-period-expenses";
import { ExpenseCharts } from "./expense-charts";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { ExpenseWithTags, IncomePaySchedule } from "@/lib/db/schema";
import type { CurrentPeriodExpenses as CurrentPeriodData } from "@/lib/projections/build-projection";

interface ExpenseDashboardProps extends MoneyDisplayContext {
  allExpenses: ExpenseWithTags[];
  allTags: string[];
  primarySchedule: IncomePaySchedule | null;
  periodData: CurrentPeriodData | null;
}

export function ExpenseDashboard({
  allExpenses,
  allTags,
  primarySchedule,
  periodData,
  displayCurrency,
  rates,
}: ExpenseDashboardProps) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <SectionHeader
          title="expenses"
          subtitle="analytics and planned spend for the current pay period"
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/expenses/recurring">
            <Button size="sm" variant="ghost">
              recurring
            </Button>
          </Link>
          <Link href="/expenses/planned">
            <Button size="sm" variant="ghost">
              one-time
            </Button>
          </Link>
        </div>
      </div>

      <ExpenseCharts
        expenses={allExpenses}
        allTags={allTags}
        displayCurrency={displayCurrency}
        rates={rates}
      />

      <CurrentPeriodExpenses
        primarySchedule={primarySchedule}
        periodData={periodData}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </div>
  );
}
