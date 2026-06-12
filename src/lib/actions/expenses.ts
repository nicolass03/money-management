"use server";

import { revalidatePath } from "next/cache";
import {
  createExpense,
  deleteExpense,
  earlyPayExpense,
  getExpenseById,
  getExpenses,
  updateExpenseAmount,
} from "@/lib/api/expenses";
import { getIncomeScheduleById } from "@/lib/api/income-schedules";
import { getPlannedExpenseById } from "@/lib/api/planned-expenses";
import { getRecurringExpenseById } from "@/lib/api/recurring-expenses";
import { getUserSettingsFromApi } from "@/lib/api/settings";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import {
  getPayDatesInRange,
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
  const settings = await getUserSettingsFromApi();
  if (!settings.primaryScheduleId) {
    return null;
  }

  const primarySchedule = await getIncomeScheduleById(
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
  id: string,
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

export async function markFuturePaymentAsPaidAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const sourceType = String(formData.get("sourceType") ?? "");
  const scheduledDate = String(formData.get("scheduledDate") ?? "");
  const paidDate = String(formData.get("paidDate") ?? "");
  const amountRaw = String(formData.get("amount") ?? "");
  const currency = String(formData.get("currency") ?? "");
  const recurringIdRaw = formData.get("recurringId");
  const plannedExpenseIdRaw = formData.get("plannedExpenseId");

  if (sourceType !== "recurring" && sourceType !== "planned") {
    return { error: "invalid payment source" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return { error: "invalid scheduled date" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidDate)) {
    return { error: "invalid paid date" };
  }

  if (!currencies.includes(currency as CurrencyCode)) {
    return { error: "invalid currency" };
  }

  const amount = parseDollarsToCents(amountRaw);
  if (amount === null || amount <= 0) {
    return { error: "invalid amount" };
  }

  const period = await getCurrentPayPeriod();
  if (!period) {
    return { error: "set a primary pay schedule in settings first" };
  }

  if (!isDateInPeriod(paidDate, period)) {
    return { error: "paid date must fall within the current pay period" };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (paidDate > today) {
    return { error: "paid date cannot be in the future" };
  }

  try {
    if (sourceType === "recurring") {
      const recurringId = String(recurringIdRaw ?? "").trim();
      if (!recurringId) {
        return { error: "invalid recurring expense" };
      }

      const recurring = await getRecurringExpenseById(recurringId);
      if (!recurring) {
        return { error: "recurring expense not found" };
      }

      const dueDates = getPayDatesInRange(
        scheduleToInput(recurring),
        scheduledDate,
        scheduledDate,
      );
      if (dueDates.length === 0) {
        return { error: "scheduled date does not match recurring expense" };
      }

      if (scheduledDate <= today) {
        return { error: "scheduled date must be in the future" };
      }

      const allExpenses = await getExpenses();
      const existing = allExpenses.find(
        (expense) =>
          expense.recurringId === recurringId &&
          (expense.scheduledDate ?? expense.date) === scheduledDate,
      );
      if (existing) {
        return { error: "this payment has already been recorded" };
      }

      await earlyPayExpense({
        sourceType: "recurring",
        scheduledDate,
        paidDate,
        amount,
        currency: currency as CurrencyCode,
        recurringId,
      });
    } else {
      const plannedExpenseId = String(plannedExpenseIdRaw ?? "").trim();
      if (!plannedExpenseId) {
        return { error: "invalid planned expense" };
      }

      const planned = await getPlannedExpenseById(plannedExpenseId);
      if (!planned) {
        return { error: "planned expense not found" };
      }

      if (planned.date !== scheduledDate) {
        return { error: "scheduled date does not match planned expense" };
      }

      if (planned.date <= today) {
        return { error: "scheduled date must be in the future" };
      }

      const allExpenses = await getExpenses();
      const existing = allExpenses.find(
        (expense) => expense.plannedExpenseId === plannedExpenseId,
      );
      if (existing) {
        return { error: "this payment has already been recorded" };
      }

      await earlyPayExpense({
        sourceType: "planned",
        scheduledDate,
        paidDate,
        amount,
        currency: currency as CurrencyCode,
        plannedExpenseId,
      });
    }

    revalidateExpensePaths();
    return { success: true };
  } catch {
    return { error: "failed to record early payment" };
  }
}

export async function deleteExpenseAction(
  id: string,
): Promise<ExpenseFormState> {
  const existing = await getExpenseById(id);
  if (!existing) {
    return { error: "expense not found" };
  }

  try {
    await deleteExpense(id);
    revalidateExpensePaths();
    return { success: true };
  } catch {
    return { error: "failed to delete expense" };
  }
}
