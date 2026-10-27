import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createIncome, deleteIncome, updateIncome } from "@/lib/api/income";
import { invalidateAfter } from "@/lib/query/invalidation";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import type { Income } from "@/lib/types/domain";
import { tError } from "@/lib/i18n/errors";
import { parseToMinorUnits } from "@/lib/currency/input";
import { mutationError, type FormResult } from "./types";

export interface IncomeInput {
  name: string;
  amount: string;
  currency: string;
  date: string;
  accountId?: string | null;
}

function validateIncomeInput(data: IncomeInput):
  | { error: string }
  | {
      data: {
        name: string;
        amount: number;
        currency: CurrencyCode;
        date: string;
        accountId: string | null;
      };
    } {
  const name = data.name.trim();
  if (!name) return { error: tError("nameRequired") };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return { error: tError("invalidDate") };
  if (!currencies.includes(data.currency as CurrencyCode)) {
    return { error: tError("invalidCurrency") };
  }
  const amount = parseToMinorUnits(data.amount, data.currency as CurrencyCode);
  if (amount === null || amount <= 0) return { error: tError("invalidAmount") };
  return {
    data: {
      name,
      amount,
      currency: data.currency as CurrencyCode,
      date: data.date,
      accountId: data.accountId ?? null,
    },
  };
}

export async function createIncomeMutation(input: IncomeInput): Promise<FormResult> {
  const result = validateIncomeInput(input);
  if ("error" in result) return result;
  try {
    await createIncome(result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedCreateIncome"));
  }
}

/** Full edit of a manual income row (the API only allows an amount override on scheduled rows). */
export async function updateIncomeMutation(
  id: string,
  input: IncomeInput,
): Promise<FormResult> {
  const result = validateIncomeInput(input);
  if ("error" in result) return result;
  try {
    await updateIncome(id, result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateIncome"));
  }
}

/**
 * Amount-only edit for a materialized scheduled income row (parity with editing a
 * recurring expense's amount). Schedule-owned name/date/currency are sent unchanged; the
 * API applies just the amount override for scheduled rows.
 */
export async function updateIncomeAmountMutation(
  entry: Income,
  amount: string,
): Promise<FormResult> {
  const result = validateIncomeInput({
    name: entry.name,
    amount,
    currency: entry.currency,
    date: entry.date,
  });
  if ("error" in result) return result;
  try {
    await updateIncome(entry.id, result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateIncome"));
  }
}

export async function deleteIncomeMutation(id: string): Promise<FormResult> {
  // Manual income is hard-deleted; materialized scheduled income is soft-deleted
  // (tombstoned) server-side so the cron does not resurrect it.
  try {
    await deleteIncome(id);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedDeleteIncome"));
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

export function useUpdateIncomeAmount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entry, amount }: { entry: Income; amount: string }) =>
      updateIncomeAmountMutation(entry, amount),
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
