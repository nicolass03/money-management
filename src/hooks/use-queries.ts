import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAccountInterest, getAccounts } from "@/lib/api/accounts";
import { getBudgetExpenses, getBudgets } from "@/lib/api/budgets";
import { getExpensePeriodView, getUpcomingPayable } from "@/lib/api/expenses";
import { getIncome } from "@/lib/api/income";
import { getIncomeSchedules } from "@/lib/api/income-schedules";
import { getMoneyContext } from "@/lib/api/money-context";
import { getPlannedExpenses } from "@/lib/api/planned-expenses";
import {
  getProjectionPeriodItems,
  getProjectionsFromApi,
} from "@/lib/api/projections";
import { getReportSummary } from "@/lib/api/reports";
import { getRecurringExpenses } from "@/lib/api/recurring-expenses";
import { getSubscriptionReminders } from "@/lib/api/subscription-reminders";
import { getSavings } from "@/lib/api/savings";
import { getRecurringTransfers, getTransfers } from "@/lib/api/transfers";
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

export function useMoneyContext() {
  return useQuery({
    queryKey: queryKeys.moneyContext(),
    queryFn: () => getMoneyContext(),
  });
}

export function useExpensePeriodView(period: ExpensePeriodKey) {
  return useQuery({
    queryKey: queryKeys.expensePeriodView(period),
    queryFn: () => getExpensePeriodView(period),
    // Keep the previous period on screen while the next one loads (no skeleton flash).
    placeholderData: keepPreviousData,
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

// Lazily fetches a past period's expense-item breakdown (frozen history rows carry aggregates
// only). Enabled only when a past row without inline items is opened.
export function useProjectionPeriodItems(
  payDate: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.projectionPeriodItems(payDate ?? ""),
    queryFn: () => getProjectionPeriodItems(payDate!),
    enabled: enabled && !!payDate,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 400 || error.status === 404)) {
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

export function useAccountInterest(accountId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.accountInterest(accountId),
    queryFn: () => getAccountInterest(accountId),
    enabled,
  });
}

export function useTransfers() {
  return useQuery({
    queryKey: queryKeys.transfers(),
    queryFn: getTransfers,
  });
}

export function useRecurringTransfers() {
  return useQuery({
    queryKey: queryKeys.recurringTransfers(),
    queryFn: getRecurringTransfers,
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
    placeholderData: keepPreviousData,
    enabled: enabled && !!from && !!to,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 400) {
        return false;
      }
      return failureCount < 1;
    },
  });
}
