import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRecurringExpense,
  deleteRecurringExpense,
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
  if (!name) return { error: "name is required" };
  const tags = parseTagNames(data.tags);
  if (tags.length === 0) return { error: "at least one tag is required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.anchorDate)) {
    return { error: "invalid anchor date" };
  }
  if (!payFrequencies.includes(data.frequency as PayFrequency)) {
    return { error: "invalid frequency" };
  }
  if (!currencies.includes(data.currency as CurrencyCode)) {
    return { error: "invalid currency" };
  }
  const amount = parseDollarsToCents(data.amount);
  if (amount === null || amount <= 0) return { error: "invalid amount" };
  const lastPaymentDate = parseLastPaymentDate(data.lastPaymentDate);
  if (lastPaymentDate && !/^\d{4}-\d{2}-\d{2}$/.test(lastPaymentDate)) {
    return { error: "invalid last payment date" };
  }
  if (lastPaymentDate && lastPaymentDate < data.anchorDate) {
    return { error: "last payment date must be on or after anchor date" };
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
    return mutationError(error, "failed to create recurring expense");
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
    if (!updated) return { error: "recurring expense not found" };
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to update recurring expense");
  }
}

export async function deleteRecurringExpenseMutation(id: string): Promise<FormResult> {
  try {
    await deleteRecurringExpense(id);
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to delete recurring expense");
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
