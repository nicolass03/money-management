import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createIncome,
  deleteIncome,
  getIncomeById,
  updateIncome,
} from "@/lib/api/income";
import { invalidateAfter } from "@/lib/query/invalidation";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { parseDollarsToCents } from "@/lib/utils";
import { mutationError, type FormResult } from "./types";

export interface IncomeInput {
  name: string;
  amount: string;
  currency: string;
  date: string;
}

function validateIncomeInput(data: IncomeInput):
  | { error: string }
  | {
      data: {
        name: string;
        amount: number;
        currency: CurrencyCode;
        date: string;
      };
    } {
  const name = data.name.trim();
  if (!name) return { error: "name is required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return { error: "invalid date" };
  if (!currencies.includes(data.currency as CurrencyCode)) {
    return { error: "invalid currency" };
  }
  const amount = parseDollarsToCents(data.amount);
  if (amount === null || amount <= 0) return { error: "invalid amount" };
  return {
    data: {
      name,
      amount,
      currency: data.currency as CurrencyCode,
      date: data.date,
    },
  };
}

function isManualIncome(entry: { source: string; scheduleId: string | null }) {
  return entry.source !== "scheduled" && entry.scheduleId == null;
}

export async function createIncomeMutation(input: IncomeInput): Promise<FormResult> {
  const result = validateIncomeInput(input);
  if ("error" in result) return result;
  try {
    await createIncome(result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to create income");
  }
}

export async function updateIncomeMutation(
  id: string,
  input: IncomeInput,
): Promise<FormResult> {
  const existing = await getIncomeById(id);
  if (!existing) return { error: "income not found" };
  if (!isManualIncome(existing)) {
    return { error: "scheduled income cannot be edited here" };
  }
  const result = validateIncomeInput(input);
  if ("error" in result) return result;
  try {
    const updated = await updateIncome(id, result.data);
    if (!updated) return { error: "income not found" };
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to update income");
  }
}

export async function deleteIncomeMutation(id: string): Promise<FormResult> {
  const existing = await getIncomeById(id);
  if (!existing) return { error: "income not found" };
  if (!isManualIncome(existing)) {
    return { error: "scheduled income cannot be deleted here" };
  }
  try {
    await deleteIncome(id);
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to delete income");
  }
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIncomeMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "incomeChange");
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: IncomeInput }) =>
      updateIncomeMutation(id, input),
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "incomeChange");
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIncomeMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "incomeChange");
    },
  });
}
