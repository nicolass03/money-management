import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRecurringTransfer,
  createTransfer,
  deleteRecurringTransfer,
  deleteTransfer,
  updateRecurringTransfer,
  updateTransfer,
} from "@/lib/api/transfers";
import { invalidateAfter } from "@/lib/query/invalidation";
import { payFrequencies, type CurrencyCode, type PayFrequency } from "@/lib/types/constants";
import { tError } from "@/lib/i18n/errors";
import { parseToMinorUnits } from "@/lib/currency/input";
import { mutationError, type FormResult } from "./types";

export interface TransferFormInput {
  name: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  /** The source account's currency (v1 transfers are same-currency). */
  currency: CurrencyCode;
  /** The transfer date, or the first occurrence of a recurring transfer. */
  date: string;
}

export interface RecurringTransferFormInput extends TransferFormInput {
  frequency: PayFrequency;
}

/** Client-side checks only; the API is the validator for account ownership and currency. */
function validateTransfer(input: TransferFormInput) {
  if (!input.fromAccountId || !input.toAccountId) {
    return { error: tError("transferAccountsRequired") } as const;
  }
  if (input.fromAccountId === input.toAccountId) {
    return { error: tError("sameTransferAccount") } as const;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { error: tError("invalidDate") } as const;
  }
  const amount = parseToMinorUnits(input.amount, input.currency);
  if (amount === null || amount <= 0) return { error: tError("invalidAmount") } as const;
  return {
    data: {
      name: input.name.trim() || null,
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amount,
      currency: input.currency,
    },
  } as const;
}

async function submit(call: () => Promise<unknown>, fallbackKey: string): Promise<FormResult> {
  try {
    await call();
    return { success: true };
  } catch (error) {
    return mutationError(error, tError(fallbackKey));
  }
}

async function saveTransfer(input: TransferFormInput, id?: string): Promise<FormResult> {
  const result = validateTransfer(input);
  if ("error" in result) return { error: result.error };
  const data = { ...result.data, date: input.date };
  return submit(
    () => (id ? updateTransfer(id, data) : createTransfer(data)),
    "failedSaveTransfer",
  );
}

async function saveRecurringTransfer(
  input: RecurringTransferFormInput,
  id?: string,
): Promise<FormResult> {
  const result = validateTransfer(input);
  if ("error" in result) return { error: result.error };
  if (!payFrequencies.includes(input.frequency)) {
    return { error: tError("invalidFrequency") };
  }
  const data = { ...result.data, anchorDate: input.date, frequency: input.frequency };
  return submit(
    () => (id ? updateRecurringTransfer(id, data) : createRecurringTransfer(data)),
    "failedSaveTransfer",
  );
}

function useTransferMutation<T>(mutationFn: (vars: T) => Promise<FormResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "transferChange");
    },
  });
}

export function useSaveTransfer() {
  return useTransferMutation(({ id, input }: { id?: string; input: TransferFormInput }) =>
    saveTransfer(input, id),
  );
}

export function useSaveRecurringTransfer() {
  return useTransferMutation(
    ({ id, input }: { id?: string; input: RecurringTransferFormInput }) =>
      saveRecurringTransfer(input, id),
  );
}

export function useDeleteTransfer() {
  return useTransferMutation((id: string) =>
    submit(() => deleteTransfer(id), "failedDeleteTransfer"),
  );
}

export function useDeleteRecurringTransfer() {
  return useTransferMutation((id: string) =>
    submit(() => deleteRecurringTransfer(id), "failedDeleteTransfer"),
  );
}
