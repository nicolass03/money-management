import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { CurrentPeriodExpenses } from "./current-period-expenses";
import { ExpenseCharts } from "./expense-charts";
import { ExpenseChartsSkeleton } from "./expense-loading-skeletons";
import { ExpensePeriodSelector } from "./expense-period-selector";
import { useExpensePeriodView, useUpcomingPayable } from "@/hooks/use-queries";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { ExpensePeriodKey, IncomePaySchedule } from "@/lib/types/domain";

interface ExpenseDashboardProps extends MoneyDisplayContext {
  primarySchedule: IncomePaySchedule | null;
}

export function ExpenseDashboard({
  primarySchedule,
  displayCurrency,
  rates,
}: ExpenseDashboardProps) {
  const [periodKey, setPeriodKey] = useState<ExpensePeriodKey>("last-period");

  const periodViewQuery = useExpensePeriodView(periodKey);
  const upcomingQuery = useUpcomingPayable();

  const periodView = periodViewQuery.data ?? null;
  const upcomingPayableItems = upcomingQuery.data ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <SectionHeader
          title="expenses"
          subtitle="analytics and spend by selected period"
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/expenses/recurring">
            <Button size="sm" variant="ghost">
              recurring
            </Button>
          </Link>
          <Link to="/expenses/planned">
            <Button size="sm" variant="ghost">
              one-time
            </Button>
          </Link>
          <Link to="/budgets">
            <Button size="sm" variant="ghost">
              budgets
            </Button>
          </Link>
        </div>
      </div>

      <ExpensePeriodSelector
        value={periodKey}
        onChange={setPeriodKey}
        className="mb-4"
      />

      {periodViewQuery.isLoading ? (
        <ExpenseChartsSkeleton />
      ) : periodView ? (
        <ExpenseCharts
          summary={periodView}
          displayCurrency={displayCurrency}
          rates={rates}
        />
      ) : null}

      <CurrentPeriodExpenses
        primarySchedule={primarySchedule}
        periodView={periodView}
        periodKey={periodKey}
        periodLoading={periodViewQuery.isLoading}
        upcomingPayableItems={upcomingPayableItems}
        upcomingLoading={upcomingQuery.isLoading}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </div>
  );
}
