
import type {
  CurrencyCode,
  ExpensePeriodKey,
  ExpensePeriodView,
  ExpenseWithTags,
  PayableFutureItem,
} from "@/lib/types/domain";
import { localTodayIso } from "@/lib/date/local-today";
import { apiFetch } from "./client";

export interface CreateExpenseInput {
  name: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  tags: string[];
  isSubscription: boolean;
  accountId?: string | null;
}

export interface EarlyPayExpenseInput {
  sourceType: "recurring" | "planned";
  scheduledDate: string;
  paidDate: string;
  amount: number;
  currency: CurrencyCode;
  recurringId?: string;
  plannedExpenseId?: string;
}

export async function getExpenses(
  from?: string,
  to?: string,
): Promise<ExpenseWithTags[]> {
  const params = new URLSearchParams();
  if (from && to) {
    params.set("from", from);
    params.set("to", to);
  }
  const query = params.toString();
  return apiFetch<ExpenseWithTags[]>(
    `/api/v1/expenses${query ? `?${query}` : ""}`,
  );
}

export async function getExpensePeriodView(
  period: ExpensePeriodKey,
): Promise<ExpensePeriodView> {
  const params = new URLSearchParams({
    period,
    includeProjected: "true",
    asOf: localTodayIso(),
  });
  return apiFetch<ExpensePeriodView>(
    `/api/v1/expenses/period-view?${params.toString()}`,
  );
}

export async function getUpcomingPayable(
  horizonDays = 30,
): Promise<PayableFutureItem[]> {
  const params = new URLSearchParams({
    horizonDays: String(horizonDays),
    asOf: localTodayIso(),
  });
  return apiFetch<PayableFutureItem[]>(
    `/api/v1/expenses/upcoming-payable?${params.toString()}`,
  );
}

export async function getExpenseById(
  id: string,
): Promise<ExpenseWithTags | null> {
  try {
    return await apiFetch<ExpenseWithTags>(`/api/v1/expenses/${id}`);
  } catch {
    return null;
  }
}

export async function createExpense(
  data: CreateExpenseInput,
): Promise<ExpenseWithTags> {
  return apiFetch<ExpenseWithTags>("/api/v1/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateExpenseAmount(
  id: string,
  amount: number,
): Promise<ExpenseWithTags | null> {
  try {
    return await apiFetch<ExpenseWithTags>(`/api/v1/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ amount }),
    });
  } catch {
    return null;
  }
}

export async function deleteExpense(id: string): Promise<void> {
  await apiFetch(`/api/v1/expenses/${id}`, { method: "DELETE" });
}

export async function earlyPayExpense(
  data: EarlyPayExpenseInput,
): Promise<ExpenseWithTags> {
  return apiFetch<ExpenseWithTags>("/api/v1/expenses/early-pay", {
    method: "POST",
    body: JSON.stringify({
      sourceType: data.sourceType,
      scheduledDate: data.scheduledDate,
      paidDate: data.paidDate,
      amount: data.amount,
      currency: data.currency,
      recurringId: data.recurringId,
      plannedExpenseId: data.plannedExpenseId,
    }),
  });
}
