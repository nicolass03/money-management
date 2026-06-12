"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { CurrentPeriodExpenses } from "./current-period-expenses";
import { ExpenseCharts } from "./expense-charts";
import { ExpensePeriodSelector } from "./expense-period-selector";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type {
  BudgetWithTags,
  ExpenseWithTags,
  IncomePaySchedule,
  PlannedExpenseWithTags,
  RecurringExpenseWithTags,
} from "@/lib/db/schema";
import {
  filterExpensesByPeriod,
  getExpensePeriodView,
  type ExpensePeriodKey,
} from "@/lib/expenses/expense-period-range";
import type { PayableFutureItem } from "@/lib/projections/upcoming-payable";

interface ExpenseDashboardProps extends MoneyDisplayContext {
  allExpenses: ExpenseWithTags[];
  allTags: string[];
  primarySchedule: IncomePaySchedule | null;
  recurringExpenses: RecurringExpenseWithTags[];
  plannedExpenses: PlannedExpenseWithTags[];
  budgets: BudgetWithTags[];
  upcomingPayableItems: PayableFutureItem[];
}

export function ExpenseDashboard({
  allExpenses,
  allTags,
  primarySchedule,
  recurringExpenses,
  plannedExpenses,
  budgets,
  upcomingPayableItems,
  displayCurrency,
  rates,
}: ExpenseDashboardProps) {
  const [periodKey, setPeriodKey] = useState<ExpensePeriodKey>("last-period");
  const today = new Date().toISOString().slice(0, 10);

  const periodExpenses = useMemo(
    () =>
      filterExpensesByPeriod(
        allExpenses,
        periodKey,
        primarySchedule,
        today,
      ),
    [allExpenses, periodKey, primarySchedule, today],
  );

  const periodView = useMemo(
    () =>
      getExpensePeriodView({
        periodKey,
        primarySchedule,
        expenses: allExpenses,
        recurringExpenses,
        plannedExpenses,
        budgets,
        displayCurrency,
        rates,
        today,
      }),
    [
      periodKey,
      primarySchedule,
      allExpenses,
      recurringExpenses,
      plannedExpenses,
      budgets,
      displayCurrency,
      rates,
      today,
    ],
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <SectionHeader
          title="expenses"
          subtitle="analytics and spend by selected period"
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
          <Link href="/budgets">
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

      <ExpenseCharts
        expenses={periodExpenses}
        allTags={allTags}
        displayCurrency={displayCurrency}
        rates={rates}
      />

      <CurrentPeriodExpenses
        primarySchedule={primarySchedule}
        periodView={periodView}
        periodKey={periodKey}
        upcomingPayableItems={upcomingPayableItems}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </div>
  );
}
