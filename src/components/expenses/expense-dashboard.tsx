import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { CurrentPeriodExpenses } from "./current-period-expenses";
import { ExpenseCharts } from "./expense-charts";
import { ExpenseChartsSkeleton } from "./expense-loading-skeletons";
import { ExpensePeriodSelector } from "./expense-period-selector";
import { PendingPeriodButton } from "./pending-period-modal";
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
  const { t } = useTranslation(["expenses", "common"]);
  const [periodKey, setPeriodKey] = useState<ExpensePeriodKey>("last-period");

  const periodViewQuery = useExpensePeriodView(periodKey);
  const upcomingQuery = useUpcomingPayable();

  const periodView = periodViewQuery.data ?? null;
  const upcomingPayableItems = upcomingQuery.data ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <SectionHeader
          title={t("expenses:title")}
          subtitle={t("expenses:subtitle")}
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-2">
          <PendingPeriodButton
            cachedPeriodView={periodKey === "last-period" ? periodView : null}
            hasPrimarySchedule={primarySchedule != null}
            displayCurrency={displayCurrency}
            rates={rates}
          />
          <Link to="/expenses/recurring">
            <Button size="sm" variant="ghost">
              {t("expenses:navRecurring")}
            </Button>
          </Link>
          <Link to="/expenses/planned">
            <Button size="sm" variant="ghost">
              {t("expenses:navOneTime")}
            </Button>
          </Link>
          <Link to="/budgets">
            <Button size="sm" variant="ghost">
              {t("expenses:navBudgets")}
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
          periodView={periodView}
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
