"use server";

import { revalidatePath } from "next/cache";
import {
  createExpense,
  getExpenseById,
  getIncomePayScheduleById,
  getUserSettings,
  updateExpenseAmount,
} from "@/lib/db/queries";
import { currencies, type CurrencyCode } from "@/lib/db/schema";
import {
  getPeriodContaining,
  isDateInPeriod,
  scheduleToInput,
} from "@/lib/income/pay-periods";
import { parseTagNames } from "@/lib/expenses/tag-utils";
import { parseDollarsToCents } from "@/lib/utils";

export interface ExpenseFormState {
  error?: string;
  success?: boolean;
}

function revalidateExpensePaths() {
  revalidatePath("/expenses");
  revalidatePath("/projections");
}

async function getCurrentPayPeriod() {
  const settings = await getUserSettings();
  if (!settings.primaryScheduleId) {
    return null;
  }

  const primarySchedule = await getIncomePayScheduleById(
    settings.primaryScheduleId,
  );
  if (!primarySchedule) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  return getPeriodContaining(scheduleToInput(primarySchedule), today);
}

function parseIsSubscription(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

function validateExpenseInput(data: {
  name: string;
  tags: string;
  amount: string;
  currency: string;
  date: string;
  isSubscription: boolean;
}):
  | { error: string }
  | {
      data: {
        name: string;
        tags: string[];
        amount: number;
        currency: CurrencyCode;
        date: string;
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
      tags,
      amount,
      currency: data.currency as CurrencyCode,
      date: data.date,
      isSubscription: data.isSubscription,
    },
  };
}

export async function createExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const result = validateExpenseInput({
    name: String(formData.get("name") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    date: String(formData.get("date") ?? ""),
    isSubscription: parseIsSubscription(formData.get("isSubscription")),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  const period = await getCurrentPayPeriod();
  if (!period) {
    return { error: "set a primary pay schedule in settings first" };
  }

  if (!isDateInPeriod(result.data.date, period)) {
    return { error: "date must fall within the current pay period" };
  }

  try {
    await createExpense(result.data);
    revalidateExpensePaths();
    return { success: true };
  } catch {
    return { error: "failed to create expense" };
  }
}

export async function updateExpenseAmountAction(
  id: number,
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const amount = parseDollarsToCents(String(formData.get("amount") ?? ""));
  if (amount === null || amount <= 0) {
    return { error: "invalid amount" };
  }

  const existing = await getExpenseById(id);
  if (!existing) {
    return { error: "expense not found" };
  }

  try {
    const updated = await updateExpenseAmount(id, amount);
    if (!updated) {
      return { error: "expense not found" };
    }
    revalidateExpensePaths();
    return { success: true };
  } catch {
    return { error: "failed to update expense" };
  }
}
