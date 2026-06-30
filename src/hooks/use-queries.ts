import { useQuery } from "@tanstack/react-query";
import { getAccounts } from "@/lib/api/accounts";
import { getBudgetExpenses, getBudgets } from "@/lib/api/budgets";
import {
  getExpensePeriodView,
  getExpenses,
  getUpcomingPayable,
} from "@/lib/api/expenses";
import { getIncome } from "@/lib/api/income";
import { getIncomeScheduleById, getIncomeSchedules } from "@/lib/api/income-schedules";
import { getMoneyContext } from "@/lib/api/money-context";
import { getPlannedExpenses } from "@/lib/api/planned-expenses";
import { getProjectionsFromApi } from "@/lib/api/projections";
import { getReportSummary } from "@/lib/api/reports";
import { getRecurringExpenses } from "@/lib/api/recurring-expenses";
import { getSubscriptionReminders } from "@/lib/api/subscription-reminders";
import { getSavings } from "@/lib/api/savings";
import { getUserSettingsFromApi } from "@/lib/api/settings";
import { getAllTagNames } from "@/lib/api/tags";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/query-keys";
import type { ExpensePeriodKey } from "@/lib/types/domain";

export function useSettings(enabled = true) {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: getUserSettingsFromApi,
    enabled,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 403) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

export function useMoneyContext(forceRefresh = false) {
  return useQuery({
    queryKey: queryKeys.moneyContext(forceRefresh),
    queryFn: () => getMoneyContext({ forceRefresh }),
  });
}

export function useExpenses(from?: string, to?: string) {
  return useQuery({
    queryKey:
      from && to
        ? ([...queryKeys.expenses(), from, to] as const)
        : queryKeys.expenses(),
    queryFn: () => getExpenses(from, to),
  });
}

export function useExpensePeriodView(period: ExpensePeriodKey) {
  return useQuery({
    queryKey: queryKeys.expensePeriodView(period),
    queryFn: () => getExpensePeriodView(period),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 400) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

export function useUpcomingPayable(horizonDays = 30) {
  return useQuery({
    queryKey: queryKeys.upcomingPayable(horizonDays),
    queryFn: () => getUpcomingPayable(horizonDays),
  });
}

export function useRecurringExpenses() {
  return useQuery({
    queryKey: queryKeys.recurringExpenses(),
    queryFn: getRecurringExpenses,
  });
}

export function useSubscriptionReminders() {
  return useQuery({
    queryKey: queryKeys.subscriptionReminders(),
    queryFn: getSubscriptionReminders,
  });
}

export function usePlannedExpenses() {
  return useQuery({
    queryKey: queryKeys.plannedExpenses(),
    queryFn: getPlannedExpenses,
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: queryKeys.budgets(),
    queryFn: getBudgets,
  });
}

export function useBudgetExpenses(budgetId: string) {
  return useQuery({
    queryKey: queryKeys.budgetExpenses(budgetId),
    queryFn: () => getBudgetExpenses(budgetId),
    enabled: !!budgetId,
  });
}

export function useAllBudgetExpenses(budgetIds: string[]) {
  return useQuery({
    queryKey: [...queryKeys.budgets(), "expenses", ...budgetIds.sort()],
    queryFn: async () => {
      const entries = await Promise.all(
        budgetIds.map(async (id) => [id, await getBudgetExpenses(id)] as const),
      );
      return Object.fromEntries(entries);
    },
    enabled: budgetIds.length > 0,
  });
}

export function useIncome() {
  return useQuery({
    queryKey: queryKeys.income(),
    queryFn: getIncome,
  });
}

export function useIncomeSchedules() {
  return useQuery({
    queryKey: queryKeys.schedules(),
    queryFn: getIncomeSchedules,
  });
}

export function useIncomeSchedule(id: string | null | undefined) {
  return useQuery({
    queryKey: [...queryKeys.schedules(), id],
    queryFn: () => getIncomeScheduleById(id!),
    enabled: !!id,
  });
}

export function useProjections(enabled = true) {
  return useQuery({
    queryKey: queryKeys.projections(),
    queryFn: getProjectionsFromApi,
    enabled,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 401)) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: getAccounts,
  });
}

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags(),
    queryFn: getAllTagNames,
  });
}

export function useSavings() {
  return useQuery({
    queryKey: queryKeys.savings(),
    queryFn: getSavings,
  });
}

export function useReportSummary(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reportSummary(from, to),
    queryFn: () => getReportSummary(from, to),
    enabled: enabled && !!from && !!to,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 400) {
        return false;
      }
      return failureCount < 1;
    },
  });
}
