import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createExpense,
  deleteExpense,
  earlyPayExpense,
  updateExpense,
  updateExpenseAmount,
} from "@/lib/api/expenses";
import { parseTagNames } from "@/lib/expenses/tag-utils";
import { localTodayIso } from "@/lib/date/local-today";
import { invalidateAfter } from "@/lib/query/invalidation";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { tError } from "@/lib/i18n/errors";
import { parseToMinorUnits } from "@/lib/currency/input";
import { mutationError, type FormResult } from "./types";

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
  const amount = parseToMinorUnits(data.amount, data.currency as CurrencyCode);
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
  try {
    await createExpense(result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedCreateExpense"));
  }
}

/** Full edit of a manual expense (the API rejects recurring / planned / budget expenses). */
export async function updateExpenseMutation(
  id: string,
  input: ExpenseInput,
): Promise<FormResult> {
  const result = validateExpenseInput(input);
  if ("error" in result) return result;
  try {
    await updateExpense(id, result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateExpense"));
  }
}

export interface ExpenseAmountInput {
  id: string;
  amount: string;
  currency: CurrencyCode;
  /** A recurring charge may be set to 0 to void an occurrence that didn't happen. */
  allowZero: boolean;
}

/** Amount override (the API rejects any other edit of a system-generated expense). */
export async function updateExpenseAmountMutation({
  id,
  amount: amountRaw,
  currency,
  allowZero,
}: ExpenseAmountInput): Promise<FormResult> {
  const amount = parseToMinorUnits(amountRaw, currency);
  if (amount === null || amount < (allowZero ? 0 : 1)) {
    return { error: tError("invalidAmount") };
  }
  try {
    await updateExpenseAmount(id, amount);
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
  const amount = parseToMinorUnits(amountRaw, currency as CurrencyCode);
  if (amount === null || amount <= 0) return { error: tError("invalidAmount") };
  const today = localTodayIso();
  if (paidDate > today) return { error: tError("paidDateInFuture") };
  if (scheduledDate <= today) return { error: tError("scheduledDateMustBeFuture") };
  const recurringId = input.recurringId?.trim();
  const plannedExpenseId = input.plannedExpenseId?.trim();
  if (sourceType === "recurring" && !recurringId) {
    return { error: tError("invalidRecurringExpense") };
  }
  if (sourceType === "planned" && !plannedExpenseId) {
    return { error: tError("invalidPlannedExpense") };
  }

  // Pay-period, schedule-match and already-recorded checks need server state; the API enforces
  // them (`POST /expenses/early-pay`), so they are not pre-fetched here.
  try {
    await earlyPayExpense({
      sourceType,
      scheduledDate,
      paidDate,
      amount,
      currency: currency as CurrencyCode,
      recurringId,
      plannedExpenseId,
    });
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedRecordEarlyPayment"));
  }
}

export async function deleteExpenseMutation(id: string): Promise<FormResult> {
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

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) =>
      updateExpenseMutation(id, input),
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "expenseChange");
    },
  });
}

export function useUpdateExpenseAmount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateExpenseAmountMutation,
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
