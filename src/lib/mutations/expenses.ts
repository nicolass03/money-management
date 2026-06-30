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
import { localTodayIso } from "@/lib/date/local-today";
import { invalidateAfter } from "@/lib/query/invalidation";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { tError } from "@/lib/i18n/errors";
import { parseDollarsToCents } from "@/lib/utils";
import { mutationError, type FormResult } from "./types";

async function getCurrentPayPeriod() {
  const settings = await getUserSettingsFromApi();
  if (!settings.primaryScheduleId) return null;
  const primarySchedule = await getIncomeScheduleById(settings.primaryScheduleId);
  if (!primarySchedule) return null;
  const today = localTodayIso();
  return getPeriodContaining(scheduleToInput(primarySchedule), today);
}

export interface ExpenseInput {
  name: string;
  tags: string;
  amount: string;
  currency: string;
  date: string;
  isSubscription: boolean;
  accountId?: string | null;
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
        accountId: string | null;
      };
    } {
  const name = data.name.trim();
  if (!name) return { error: tError("nameRequired") };
  const tags = parseTagNames(data.tags);
  if (tags.length === 0) return { error: tError("tagRequired") };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return { error: tError("invalidDate") };
  if (!currencies.includes(data.currency as CurrencyCode)) {
    return { error: tError("invalidCurrency") };
  }
  const amount = parseDollarsToCents(data.amount);
  if (amount === null || amount <= 0) return { error: tError("invalidAmount") };
  return {
    data: {
      name,
      tags,
      amount,
      currency: data.currency as CurrencyCode,
      date: data.date,
      isSubscription: data.isSubscription,
      accountId: data.accountId ?? null,
    },
  };
}

export async function createExpenseMutation(input: ExpenseInput): Promise<FormResult> {
  const result = validateExpenseInput(input);
  if ("error" in result) return result;
  const period = await getCurrentPayPeriod();
  if (!period) return { error: tError("noPrimarySchedule") };
  if (!isDateInPeriod(result.data.date, period)) {
    return { error: tError("dateOutsidePayPeriod") };
  }
  try {
    await createExpense(result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedCreateExpense"));
  }
}

export async function updateExpenseAmountMutation(
  id: string,
  amountRaw: string,
): Promise<FormResult> {
  const amount = parseDollarsToCents(amountRaw);
  if (amount === null || amount <= 0) return { error: tError("invalidAmount") };
  const existing = await getExpenseById(id);
  if (!existing) return { error: tError("expenseNotFound") };
  try {
    const updated = await updateExpenseAmount(id, amount);
    if (!updated) return { error: tError("expenseNotFound") };
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateExpense"));
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
    return { error: tError("invalidPaymentSource") };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return { error: tError("invalidScheduledDate") };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidDate)) {
    return { error: tError("invalidPaidDate") };
  }
  if (!currencies.includes(currency as CurrencyCode)) {
    return { error: tError("invalidCurrency") };
  }
  const amount = parseDollarsToCents(amountRaw);
  if (amount === null || amount <= 0) return { error: tError("invalidAmount") };
  const period = await getCurrentPayPeriod();
  if (!period) return { error: tError("noPrimarySchedule") };
  if (!isDateInPeriod(paidDate, period)) {
    return { error: tError("paidDateOutsidePayPeriod") };
  }
  const today = localTodayIso();
  if (paidDate > today) return { error: tError("paidDateInFuture") };

  try {
    if (sourceType === "recurring") {
      const recurringId = String(input.recurringId ?? "").trim();
      if (!recurringId) return { error: tError("invalidRecurringExpense") };
      const recurring = await getRecurringExpenseById(recurringId);
      if (!recurring) return { error: tError("recurringExpenseNotFound") };
      const dueDates = getPayDatesInRange(
        scheduleToInput(recurring),
        scheduledDate,
        scheduledDate,
      );
      if (dueDates.length === 0) {
        return { error: tError("scheduledDateMismatchRecurring") };
      }
      if (scheduledDate <= today) {
        return { error: tError("scheduledDateMustBeFuture") };
      }
      const allExpenses = await getExpenses();
      if (
        allExpenses.some(
          (e) =>
            e.recurringId === recurringId &&
            (e.scheduledDate ?? e.date) === scheduledDate,
        )
      ) {
        return { error: tError("paymentAlreadyRecorded") };
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
      if (!plannedExpenseId) return { error: tError("invalidPlannedExpense") };
      const planned = await getPlannedExpenseById(plannedExpenseId);
      if (!planned) return { error: tError("plannedExpenseNotFound") };
      if (planned.date !== scheduledDate) {
        return { error: tError("scheduledDateMismatchPlanned") };
      }
      if (planned.date <= today) {
        return { error: tError("scheduledDateMustBeFuture") };
      }
      const allExpenses = await getExpenses();
      if (allExpenses.some((e) => e.plannedExpenseId === plannedExpenseId)) {
        return { error: tError("paymentAlreadyRecorded") };
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
    return mutationError(error, tError("failedRecordEarlyPayment"));
  }
}

export async function deleteExpenseMutation(id: string): Promise<FormResult> {
  const existing = await getExpenseById(id);
  if (!existing) return { error: tError("expenseNotFound") };
  try {
    await deleteExpense(id);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedDeleteExpense"));
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
