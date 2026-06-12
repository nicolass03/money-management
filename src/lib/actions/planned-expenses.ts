"use server";

import { handleActionError } from "@/lib/actions/action-error";
import { revalidatePath } from "next/cache";
import {
  createPlannedExpense,
  deletePlannedExpense,
  updatePlannedExpense,
} from "@/lib/api/planned-expenses";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { parseTagNames } from "@/lib/expenses/tag-utils";
import { parseDollarsToCents } from "@/lib/utils";

export interface PlannedFormState {
  error?: string;
  success?: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function validatePlannedInput(
  data: {
    name: string;
    date: string;
    amount: string;
    currency: string;
    tags: string;
  },
  options: { requireFutureDate: boolean },
):
  | { error: string }
  | {
      data: {
        name: string;
        date: string;
        amount: number;
        currency: CurrencyCode;
        tags: string[];
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

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    return { error: "invalid date" };
  }

  if (options.requireFutureDate && data.date <= todayIso()) {
    return { error: "date must be in the future" };
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
      date: data.date,
      amount,
      currency: data.currency as CurrencyCode,
      tags,
    },
  };
}

function revalidateExpensePaths() {
  revalidatePath("/expenses");
  revalidatePath("/expenses/planned");
  revalidatePath("/projections");
}

export async function createPlannedExpenseAction(
  _prev: PlannedFormState,
  formData: FormData,
): Promise<PlannedFormState> {
  const result = validatePlannedInput(
    {
      name: String(formData.get("name") ?? ""),
      date: String(formData.get("date") ?? ""),
      amount: String(formData.get("amount") ?? ""),
      currency: String(formData.get("currency") ?? ""),
      tags: String(formData.get("tags") ?? ""),
    },
    { requireFutureDate: true },
  );

  if ("error" in result) {
    return { error: result.error };
  }

  try {
    await createPlannedExpense(result.data);
    revalidateExpensePaths();
    return { success: true };
  } catch (error) {
    return handleActionError(error, "failed to create planned expense");
  }
}

export async function updatePlannedExpenseAction(
  id: string,
  _prev: PlannedFormState,
  formData: FormData,
): Promise<PlannedFormState> {
  const result = validatePlannedInput(
    {
      name: String(formData.get("name") ?? ""),
      date: String(formData.get("date") ?? ""),
      amount: String(formData.get("amount") ?? ""),
      currency: String(formData.get("currency") ?? ""),
      tags: String(formData.get("tags") ?? ""),
    },
    { requireFutureDate: false },
  );

  if ("error" in result) {
    return { error: result.error };
  }

  try {
    const updated = await updatePlannedExpense(id, result.data);
    if (!updated) {
      return { error: "planned expense not found" };
    }
    revalidateExpensePaths();
    return { success: true };
  } catch (error) {
    return handleActionError(error, "failed to update planned expense");
  }
}

export async function deletePlannedExpenseAction(
  id: string,
): Promise<PlannedFormState> {
  try {
    await deletePlannedExpense(id);
    revalidateExpensePaths();
    return { success: true };
  } catch (error) {
    return handleActionError(error, "failed to delete planned expense");
  }
}
