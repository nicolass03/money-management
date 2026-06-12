"use server";

import { revalidatePath } from "next/cache";
import {
  createIncome,
  deleteIncome,
  getIncomeById,
  updateIncome,
} from "@/lib/api/income";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { parseDollarsToCents } from "@/lib/utils";

export interface IncomeFormState {
  error?: string;
  success?: boolean;
}

function revalidateIncomePaths() {
  revalidatePath("/income");
  revalidatePath("/projections");
}

function validateIncomeInput(data: {
  name: string;
  amount: string;
  currency: string;
  date: string;
}):
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
  if (!name) {
    return { error: "name is required" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    return { error: "invalid date" };
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
      amount,
      currency: data.currency as CurrencyCode,
      date: data.date,
    },
  };
}

function isManualIncome(entry: { source: string; scheduleId: string | null }) {
  return entry.source !== "scheduled" && entry.scheduleId == null;
}

export async function createIncomeAction(
  _prev: IncomeFormState,
  formData: FormData,
): Promise<IncomeFormState> {
  const result = validateIncomeInput({
    name: String(formData.get("name") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    date: String(formData.get("date") ?? ""),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  try {
    await createIncome(result.data);
    revalidateIncomePaths();
    return { success: true };
  } catch {
    return { error: "failed to create income" };
  }
}

export async function updateIncomeAction(
  id: string,
  _prev: IncomeFormState,
  formData: FormData,
): Promise<IncomeFormState> {
  const existing = await getIncomeById(id);
  if (!existing) {
    return { error: "income not found" };
  }

  if (!isManualIncome(existing)) {
    return { error: "scheduled income cannot be edited here" };
  }

  const result = validateIncomeInput({
    name: String(formData.get("name") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    date: String(formData.get("date") ?? ""),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  try {
    const updated = await updateIncome(id, result.data);
    if (!updated) {
      return { error: "income not found" };
    }
    revalidateIncomePaths();
    return { success: true };
  } catch {
    return { error: "failed to update income" };
  }
}

export async function deleteIncomeAction(
  id: string,
): Promise<IncomeFormState> {
  const existing = await getIncomeById(id);
  if (!existing) {
    return { error: "income not found" };
  }

  if (!isManualIncome(existing)) {
    return { error: "scheduled income cannot be deleted here" };
  }

  try {
    await deleteIncome(id);
    revalidateIncomePaths();
    return { success: true };
  } catch {
    return { error: "failed to delete income" };
  }
}
