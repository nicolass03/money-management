import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createExpense,
  deleteExpense,
  earlyPayExpense,
  getExpenseById,
  getExpenses,
  updateExpenseAmount,
} from "@/lib/api/expenses";
import { getIncomeScheduleById } from "@/lib/api/income-schedules";
import { getPlannedExpenseById } from "@/lib/api/planned-expenses";
import { getRecurringExpenseById } from "@/lib/api/recurring-expenses";
import { getUserSettingsFromApi } from "@/lib/api/settings";
import { parseTagNames } from "@/lib/expenses/tag-utils";
import {
  getPayDatesInRange,
  getPeriodContaining,
  isDateInPeriod,
  scheduleToInput,
} from "@/lib/income/pay-periods";
import { invalidateAfter } from "@/lib/query/invalidation";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { parseDollarsToCents } from "@/lib/utils";
import { mutationError, type FormResult } from "./types";

async function getCurrentPayPeriod() {
  const settings = await getUserSettingsFromApi();
  if (!settings.primaryScheduleId) return null;
  const primarySchedule = await getIncomeScheduleById(settings.primaryScheduleId);
  if (!primarySchedule) return null;
  const today = new Date().toISOString().slice(0, 10);
  return getPeriodContaining(scheduleToInput(primarySchedule), today);
}

export interface ExpenseInput {
  name: string;
  tags: string;
  amount: string;
  currency: string;
  date: string;
  isSubscription: boolean;
}

function validateExpenseInput(data: ExpenseInput):
  | { error: string }
  | {
      data: {
        name: string;
        tags: string[];
        amount: number;
        currency: CurrencyCode;
        date: string;
        isSubscription: boolean;
      };
    } {
  const name = data.name.trim();
  if (!name) return { error: "name is required" };
  const tags = parseTagNames(data.tags);
  if (tags.length === 0) return { error: "at least one tag is required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return { error: "invalid date" };
  if (!currencies.includes(data.currency as CurrencyCode)) {
    return { error: "invalid currency" };
  }
  const amount = parseDollarsToCents(data.amount);
  if (amount === null || amount <= 0) return { error: "invalid amount" };
  return {
    data: {
      name,
      tags,
      amount,
      currency: data.currency as CurrencyCode,
      date: data.date,
      isSubscription: data.isSubscription,
    },
  };
}

export async function createExpenseMutation(input: ExpenseInput): Promise<FormResult> {
  const result = validateExpenseInput(input);
  if ("error" in result) return result;
  const period = await getCurrentPayPeriod();
  if (!period) return { error: "set a primary pay schedule in settings first" };
  if (!isDateInPeriod(result.data.date, period)) {
    return { error: "date must fall within the current pay period" };
  }
  try {
    await createExpense(result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to create expense");
  }
}

export async function updateExpenseAmountMutation(
  id: string,
  amountRaw: string,
): Promise<FormResult> {
  const amount = parseDollarsToCents(amountRaw);
  if (amount === null || amount <= 0) return { error: "invalid amount" };
  const existing = await getExpenseById(id);
  if (!existing) return { error: "expense not found" };
  try {
    const updated = await updateExpenseAmount(id, amount);
    if (!updated) return { error: "expense not found" };
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to update expense");
  }
}

export interface EarlyPayInput {
  sourceType: string;
  scheduledDate: string;
  paidDate: string;
  amount: string;
  currency: string;
  recurringId?: string;
  plannedExpenseId?: string;
}

export async function markFuturePaymentAsPaidMutation(
  input: EarlyPayInput,
): Promise<FormResult> {
  const { sourceType, scheduledDate, paidDate, amount: amountRaw, currency } = input;
  if (sourceType !== "recurring" && sourceType !== "planned") {
    return { error: "invalid payment source" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return { error: "invalid scheduled date" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidDate)) {
    return { error: "invalid paid date" };
  }
  if (!currencies.includes(currency as CurrencyCode)) {
    return { error: "invalid currency" };
  }
  const amount = parseDollarsToCents(amountRaw);
  if (amount === null || amount <= 0) return { error: "invalid amount" };
  const period = await getCurrentPayPeriod();
  if (!period) return { error: "set a primary pay schedule in settings first" };
  if (!isDateInPeriod(paidDate, period)) {
    return { error: "paid date must fall within the current pay period" };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (paidDate > today) return { error: "paid date cannot be in the future" };

  try {
    if (sourceType === "recurring") {
      const recurringId = String(input.recurringId ?? "").trim();
      if (!recurringId) return { error: "invalid recurring expense" };
      const recurring = await getRecurringExpenseById(recurringId);
      if (!recurring) return { error: "recurring expense not found" };
      const dueDates = getPayDatesInRange(
        scheduleToInput(recurring),
        scheduledDate,
        scheduledDate,
      );
      if (dueDates.length === 0) {
        return { error: "scheduled date does not match recurring expense" };
      }
      if (scheduledDate <= today) {
        return { error: "scheduled date must be in the future" };
      }
      const allExpenses = await getExpenses();
      if (
        allExpenses.some(
          (e) =>
            e.recurringId === recurringId &&
            (e.scheduledDate ?? e.date) === scheduledDate,
        )
      ) {
        return { error: "this payment has already been recorded" };
      }
      await earlyPayExpense({
        sourceType: "recurring",
        scheduledDate,
        paidDate,
        amount,
        currency: currency as CurrencyCode,
        recurringId,
      });
    } else {
      const plannedExpenseId = String(input.plannedExpenseId ?? "").trim();
      if (!plannedExpenseId) return { error: "invalid planned expense" };
      const planned = await getPlannedExpenseById(plannedExpenseId);
      if (!planned) return { error: "planned expense not found" };
      if (planned.date !== scheduledDate) {
        return { error: "scheduled date does not match planned expense" };
      }
      if (planned.date <= today) {
        return { error: "scheduled date must be in the future" };
      }
      const allExpenses = await getExpenses();
      if (allExpenses.some((e) => e.plannedExpenseId === plannedExpenseId)) {
        return { error: "this payment has already been recorded" };
      }
      await earlyPayExpense({
        sourceType: "planned",
        scheduledDate,
        paidDate,
        amount,
        currency: currency as CurrencyCode,
        plannedExpenseId,
      });
    }
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to record early payment");
  }
}

export async function deleteExpenseMutation(id: string): Promise<FormResult> {
  const existing = await getExpenseById(id);
  if (!existing) return { error: "expense not found" };
  try {
    await deleteExpense(id);
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to delete expense");
  }
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExpenseMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "expenseChange");
    },
  });
}

export function useUpdateExpenseAmount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: string }) =>
      updateExpenseAmountMutation(id, amount),
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "expenseChange");
    },
  });
}

export function useMarkFuturePaymentAsPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markFuturePaymentAsPaidMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "expenseChange");
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExpenseMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "expenseChange");
    },
  });
}
