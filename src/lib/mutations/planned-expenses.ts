import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPlannedExpense,
  deletePlannedExpense,
  payPlannedExpense,
  updatePlannedExpense,
} from "@/lib/api/planned-expenses";
import { parseTagNames } from "@/lib/expenses/tag-utils";
import { localTodayIso } from "@/lib/date/local-today";
import { invalidateAfter } from "@/lib/query/invalidation";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { tError } from "@/lib/i18n/errors";
import { parseDollarsToCents } from "@/lib/utils";
import { mutationError, type FormResult } from "./types";

function todayIso() {
  return localTodayIso();
}

export interface PlannedInput {
  name: string;
  date: string;
  amount: string;
  currency: string;
  tags: string;
  accountId?: string | null;
}

function validatePlannedInput(
  data: PlannedInput,
  options: { requireFutureDate: boolean },
):
  | { error: string }
  | {
      data: {
        name: string;
        date: string | null;
        amount: number;
        currency: CurrencyCode;
        tags: string[];
        accountId: string | null;
      };
    } {
  const name = data.name.trim();
  if (!name) return { error: tError("nameRequired") };
  const tags = parseTagNames(data.tags);
  if (tags.length === 0) return { error: tError("tagRequired") };
  // An empty date means undated (e.g. a debt with no due date).
  const date = data.date.trim() || null;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: tError("invalidDate") };
  if (options.requireFutureDate && date && date <= todayIso()) {
    return { error: tError("dateMustBeFuture") };
  }
  if (!currencies.includes(data.currency as CurrencyCode)) {
    return { error: tError("invalidCurrency") };
  }
  const amount = parseDollarsToCents(data.amount);
  if (amount === null || amount <= 0) return { error: tError("invalidAmount") };
  return {
    data: {
      name,
      date,
      amount,
      currency: data.currency as CurrencyCode,
      tags,
      accountId: data.accountId ?? null,
    },
  };
}

export async function createPlannedExpenseMutation(
  input: PlannedInput,
): Promise<FormResult> {
  const result = validatePlannedInput(input, { requireFutureDate: true });
  if ("error" in result) return result;
  try {
    await createPlannedExpense(result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedCreatePlanned"));
  }
}

export async function updatePlannedExpenseMutation(
  id: string,
  input: PlannedInput,
): Promise<FormResult> {
  const result = validatePlannedInput(input, { requireFutureDate: false });
  if ("error" in result) return result;
  try {
    const updated = await updatePlannedExpense(id, result.data);
    if (!updated) return { error: tError("plannedExpenseNotFound") };
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdatePlanned"));
  }
}

export async function deletePlannedExpenseMutation(id: string): Promise<FormResult> {
  try {
    await deletePlannedExpense(id);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedDeletePlanned"));
  }
}

export async function payPlannedExpenseMutation(
  id: string,
  amountInput: string,
): Promise<FormResult> {
  const amount = parseDollarsToCents(amountInput);
  if (amount === null || amount <= 0) return { error: tError("invalidAmount") };
  try {
    await payPlannedExpense(id, amount);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedPayPlanned"));
  }
}

export function usePayPlannedExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: string }) =>
      payPlannedExpenseMutation(id, amount),
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "plannedChange");
    },
  });
}

export function useCreatePlannedExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlannedExpenseMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "plannedChange");
    },
  });
}

export function useUpdatePlannedExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PlannedInput }) =>
      updatePlannedExpenseMutation(id, input),
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "plannedChange");
    },
  });
}

export function useDeletePlannedExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlannedExpenseMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "plannedChange");
    },
  });
}
