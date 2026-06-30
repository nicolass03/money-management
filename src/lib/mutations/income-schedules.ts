import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createIncomeSchedule,
  deleteIncomeSchedule,
  updateIncomeSchedule,
} from "@/lib/api/income-schedules";
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

export interface ScheduleInput {
  name: string;
  anchorDate: string;
  frequency: string;
  amount: string;
  currency: string;
  accountId?: string | null;
}

function validateScheduleInput(data: ScheduleInput):
  | { error: string }
  | {
      data: {
        name: string;
        anchorDate: string;
        frequency: PayFrequency;
        amount: number;
        currency: CurrencyCode;
        accountId: string | null;
      };
    } {
  const name = data.name.trim();
  if (!name) return { error: tError("nameRequired") };
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
  return {
    data: {
      name,
      anchorDate: data.anchorDate,
      frequency: data.frequency as PayFrequency,
      amount,
      currency: data.currency as CurrencyCode,
      accountId: data.accountId ?? null,
    },
  };
}

export async function createScheduleMutation(
  input: ScheduleInput,
): Promise<FormResult> {
  const result = validateScheduleInput(input);
  if ("error" in result) return result;
  try {
    await createIncomeSchedule(result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedCreateSchedule"));
  }
}

export async function updateScheduleMutation(
  id: string,
  input: ScheduleInput,
): Promise<FormResult> {
  const result = validateScheduleInput(input);
  if ("error" in result) return result;
  try {
    const updated = await updateIncomeSchedule(id, result.data);
    if (!updated) return { error: tError("scheduleNotFound") };
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateSchedule"));
  }
}

export async function deleteScheduleMutation(id: string): Promise<FormResult> {
  try {
    await deleteIncomeSchedule(id);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedDeleteSchedule"));
  }
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createScheduleMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "scheduleChange");
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ScheduleInput }) =>
      updateScheduleMutation(id, input),
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "scheduleChange");
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteScheduleMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "scheduleChange");
    },
  });
}
