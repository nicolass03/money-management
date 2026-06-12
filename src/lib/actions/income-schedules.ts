"use server";

import { revalidatePath } from "next/cache";
import {
  createIncomeSchedule,
  deleteIncomeSchedule,
  updateIncomeSchedule,
} from "@/lib/api/income-schedules";
import {
  currencies,
  payFrequencies,
  type CurrencyCode,
  type PayFrequency,
} from "@/lib/types/constants";
import { parseDollarsToCents } from "@/lib/utils";

export interface ScheduleFormState {
  error?: string;
  success?: boolean;
}

function validateScheduleInput(data: {
  name: string;
  anchorDate: string;
  frequency: string;
  amount: string;
  currency: string;
}):
  | { error: string }
  | {
      data: {
        name: string;
        anchorDate: string;
        frequency: PayFrequency;
        amount: number;
        currency: CurrencyCode;
      };
    } {
  const name = data.name.trim();
  if (!name) {
    return { error: "name is required" };
  }

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
  if (amount === null || amount <= 0) {
    return { error: "invalid amount" };
  }

  return {
    data: {
      name,
      anchorDate: data.anchorDate,
      frequency: data.frequency as PayFrequency,
      amount,
      currency: data.currency as CurrencyCode,
    },
  };
}

function revalidateSchedulePaths() {
  revalidatePath("/settings");
  revalidatePath("/income");
  revalidatePath("/projections");
}

export async function createSchedule(
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const result = validateScheduleInput({
    name: String(formData.get("name") ?? ""),
    anchorDate: String(formData.get("anchorDate") ?? ""),
    frequency: String(formData.get("frequency") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  try {
    await createIncomeSchedule(result.data);
    revalidateSchedulePaths();
    return { success: true };
  } catch {
    return { error: "failed to create schedule" };
  }
}

export async function updateSchedule(
  id: string,
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const result = validateScheduleInput({
    name: String(formData.get("name") ?? ""),
    anchorDate: String(formData.get("anchorDate") ?? ""),
    frequency: String(formData.get("frequency") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  try {
    const updated = await updateIncomeSchedule(id, result.data);
    if (!updated) {
      return { error: "schedule not found" };
    }
    revalidateSchedulePaths();
    return { success: true };
  } catch {
    return { error: "failed to update schedule" };
  }
}

export async function deleteSchedule(id: string): Promise<ScheduleFormState> {
  try {
    await deleteIncomeSchedule(id);
    revalidateSchedulePaths();
    return { success: true };
  } catch {
    return { error: "failed to delete schedule" };
  }
}
