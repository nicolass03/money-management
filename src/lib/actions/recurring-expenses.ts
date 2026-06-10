"use server";

import { revalidatePath } from "next/cache";
import {
  createRecurringExpense,
  deleteRecurringExpense,
  updateRecurringExpense,
} from "@/lib/db/queries";
import {
  currencies,
  payFrequencies,
  type CurrencyCode,
  type PayFrequency,
} from "@/lib/db/schema";
import { parseTagNames } from "@/lib/expenses/tag-utils";
import { parseDollarsToCents } from "@/lib/utils";

export interface RecurringFormState {
  error?: string;
  success?: boolean;
}

function parseIsSubscription(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

function validateRecurringInput(data: {
  name: string;
  anchorDate: string;
  frequency: string;
  amount: string;
  currency: string;
  tags: string;
  isSubscription: boolean;
}):
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
      };
    } {
  const name = data.name.trim();
  if (!name) {
    return { error: "name is required" };
  }

  const tags = parseTagNames(data.tags);
  if (tags.length === 0) {
    return { error: "at least one tag is required" };
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
      tags,
      isSubscription: data.isSubscription,
    },
  };
}

function revalidateExpensePaths() {
  revalidatePath("/expenses");
  revalidatePath("/expenses/configure");
  revalidatePath("/projections");
}

export async function createRecurringExpenseAction(
  _prev: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> {
  const result = validateRecurringInput({
    name: String(formData.get("name") ?? ""),
    anchorDate: String(formData.get("anchorDate") ?? ""),
    frequency: String(formData.get("frequency") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    isSubscription: parseIsSubscription(formData.get("isSubscription")),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  try {
    await createRecurringExpense(result.data);
    revalidateExpensePaths();
    return { success: true };
  } catch {
    return { error: "failed to create recurring expense" };
  }
}

export async function updateRecurringExpenseAction(
  id: number,
  _prev: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> {
  const result = validateRecurringInput({
    name: String(formData.get("name") ?? ""),
    anchorDate: String(formData.get("anchorDate") ?? ""),
    frequency: String(formData.get("frequency") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    isSubscription: parseIsSubscription(formData.get("isSubscription")),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  try {
    const updated = await updateRecurringExpense(id, result.data);
    if (!updated) {
      return { error: "recurring expense not found" };
    }
    revalidateExpensePaths();
    return { success: true };
  } catch {
    return { error: "failed to update recurring expense" };
  }
}

export async function deleteRecurringExpenseAction(
  id: number,
): Promise<RecurringFormState> {
  try {
    await deleteRecurringExpense(id);
    revalidateExpensePaths();
    return { success: true };
  } catch {
    return { error: "failed to delete recurring expense" };
  }
}
