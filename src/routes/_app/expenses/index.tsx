import { createFileRoute } from "@tanstack/react-router";
import { ExpenseDashboard } from "@/components/expenses/expense-dashboard";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  useBudgets,
  useExpenses,
  useIncomeSchedule,
  useMoneyContext,
  usePlannedExpenses,
  useRecurringExpenses,
  useSettings,
  useTags,
} from "@/hooks/use-queries";
import { getUpcomingPayableItems } from "@/lib/projections/upcoming-payable";

export const Route = createFileRoute("/_app/expenses/")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const expenses = useExpenses();
  const recurring = useRecurringExpenses();
  const planned = usePlannedExpenses();
  const budgets = useBudgets();
  const tags = useTags();
  const settings = useSettings();
  const money = useMoneyContext();
  const primarySchedule = useIncomeSchedule(settings.data?.primaryScheduleId);

  const isLoading =
    expenses.isLoading ||
    recurring.isLoading ||
    planned.isLoading ||
    budgets.isLoading ||
    tags.isLoading ||
    settings.isLoading ||
    money.isLoading ||
    (settings.data?.primaryScheduleId ? primarySchedule.isLoading : false);

  if (isLoading || !money.data) {
    return <LoadingIndicator label="fetching data" />;
  }

  const allExpenses = expenses.data ?? [];
  const recurringExpenses = recurring.data ?? [];
  const plannedExpenses = planned.data ?? [];

  const upcomingPayableItems = getUpcomingPayableItems({
    expenses: allExpenses,
    recurringExpenses,
    plannedExpenses,
  });

  return (
    <ExpenseDashboard
      allExpenses={allExpenses}
      allTags={tags.data ?? []}
      primarySchedule={primarySchedule.data ?? null}
      recurringExpenses={recurringExpenses}
      plannedExpenses={plannedExpenses}
      budgets={budgets.data ?? []}
      upcomingPayableItems={upcomingPayableItems}
      displayCurrency={money.data.displayCurrency}
      rates={money.data.rates}
    />
  );
}
