import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRecurringExpense,
  deleteRecurringExpense,
  setCancelReminder,
  updateRecurringExpense,
} from "@/lib/api/recurring-expenses";
import { parseTagNames } from "@/lib/expenses/tag-utils";
import { invalidateAfter } from "@/lib/query/invalidation";
import {
  currencies,
  payFrequencies,
  type CurrencyCode,
  type PayFrequency,
} from "@/lib/types/constants";
import { tError } from "@/lib/i18n/errors";
import { parseDollarsToCents } from "@/lib/utils";
import { mutationError, type FormResult } from "./types";

export interface RecurringInput {
  name: string;
  anchorDate: string;
  frequency: string;
  amount: string;
  currency: string;
  tags: string;
  isSubscription: boolean;
  lastPaymentDate: string;
}

function parseLastPaymentDate(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateRecurringInput(data: RecurringInput):
  | { error: string }
  | {
      data: {
        name: string;
        anchorDate: string;
        frequency: PayFrequency;
        amount: number;
        currency: CurrencyCode;
        tags: string[];
        isSubscription: boolean;
        lastPaymentDate: string | null;
      };
    } {
  const name = data.name.trim();
  if (!name) return { error: tError("nameRequired") };
  const tags = parseTagNames(data.tags);
  if (tags.length === 0) return { error: tError("tagRequired") };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.anchorDate)) {
    return { error: tError("invalidAnchorDate") };
  }
  if (!payFrequencies.includes(data.frequency as PayFrequency)) {
    return { error: tError("invalidFrequency") };
  }
  if (!currencies.includes(data.currency as CurrencyCode)) {
    return { error: tError("invalidCurrency") };
  }
  const amount = parseDollarsToCents(data.amount);
  if (amount === null || amount <= 0) return { error: tError("invalidAmount") };
  const lastPaymentDate = parseLastPaymentDate(data.lastPaymentDate);
  if (lastPaymentDate && !/^\d{4}-\d{2}-\d{2}$/.test(lastPaymentDate)) {
    return { error: tError("invalidLastPaymentDate") };
  }
  if (lastPaymentDate && lastPaymentDate < data.anchorDate) {
    return { error: tError("lastPaymentBeforeAnchor") };
  }
  return {
    data: {
      name,
      anchorDate: data.anchorDate,
      frequency: data.frequency as PayFrequency,
      amount,
      currency: data.currency as CurrencyCode,
      tags,
      isSubscription: data.isSubscription,
      lastPaymentDate,
    },
  };
}

export async function createRecurringExpenseMutation(
  input: RecurringInput,
): Promise<FormResult> {
  const result = validateRecurringInput(input);
  if ("error" in result) return result;
  try {
    await createRecurringExpense(result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedCreateRecurring"));
  }
}

export async function updateRecurringExpenseMutation(
  id: string,
  input: RecurringInput,
): Promise<FormResult> {
  const result = validateRecurringInput(input);
  if ("error" in result) return result;
  try {
    const updated = await updateRecurringExpense(id, result.data);
    if (!updated) return { error: tError("recurringExpenseNotFound") };
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateRecurring"));
  }
}

export async function deleteRecurringExpenseMutation(id: string): Promise<FormResult> {
  try {
    await deleteRecurringExpense(id);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedDeleteRecurring"));
  }
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRecurringExpenseMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "recurringChange");
    },
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RecurringInput }) =>
      updateRecurringExpenseMutation(id, input),
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "recurringChange");
    },
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecurringExpenseMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "recurringChange");
    },
  });
}

export async function setCancelReminderMutation(
  id: string,
  enabled: boolean,
): Promise<FormResult> {
  try {
    await setCancelReminder(id, enabled);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedCancelReminder"));
  }
}

export function useSetCancelReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      setCancelReminderMutation(id, enabled),
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "recurringChange");
    },
  });
}
