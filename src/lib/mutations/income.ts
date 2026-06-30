import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createIncome,
  deleteIncome,
  getIncomeById,
  updateIncome,
} from "@/lib/api/income";
import { invalidateAfter } from "@/lib/query/invalidation";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { tError } from "@/lib/i18n/errors";
import { parseDollarsToCents } from "@/lib/utils";
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
  const amount = parseDollarsToCents(data.amount);
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
    return mutationError(error, tError("failedCreateIncome"));
  }
}

export async function updateIncomeMutation(
  id: string,
  input: IncomeInput,
): Promise<FormResult> {
  const existing = await getIncomeById(id);
  if (!existing) return { error: tError("incomeNotFound") };
  if (!isManualIncome(existing)) {
    return { error: tError("scheduledIncomeNotEditable") };
  }
  const result = validateIncomeInput(input);
  if ("error" in result) return result;
  try {
    const updated = await updateIncome(id, result.data);
    if (!updated) return { error: tError("incomeNotFound") };
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
  id: string,
  amount: string,
): Promise<FormResult> {
  const existing = await getIncomeById(id);
  if (!existing) return { error: tError("incomeNotFound") };
  const result = validateIncomeInput({
    name: existing.name,
    amount,
    currency: existing.currency,
    date: existing.date,
  });
  if ("error" in result) return result;
  try {
    const updated = await updateIncome(id, result.data);
    if (!updated) return { error: tError("incomeNotFound") };
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
    mutationFn: ({ id, amount }: { id: string; amount: string }) =>
      updateIncomeAmountMutation(id, amount),
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
