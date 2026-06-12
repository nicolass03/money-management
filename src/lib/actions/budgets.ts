"use server";

import { revalidatePath } from "next/cache";
import {
  createBudget,
  createBudgetExpense,
  deleteBudget,
  deleteBudgetExpense,
  getBudgetByIdWithTags,
  updateBudget,
} from "@/lib/db/queries";
import { currencies, type CurrencyCode } from "@/lib/db/schema";
import { isDatedBudget } from "@/lib/budgets/budget-status";
import { parseTagNames } from "@/lib/expenses/tag-utils";
import {
  getPeriodContaining,
  isDateInPeriod,
  scheduleToInput,
} from "@/lib/income/pay-periods";
import { getIncomePayScheduleById, getUserSettings } from "@/lib/db/queries";
import { parseDollarsToCents } from "@/lib/utils";

export interface BudgetFormState {
  error?: string;
  success?: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function revalidateBudgetPaths() {
  revalidatePath("/budgets");
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

  const today = todayIso();
  return getPeriodContaining(scheduleToInput(primarySchedule), today);
}

function parseOptionalDate(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null;
  }
  return raw;
}

function validateBudgetInput(data: {
  name: string;
  amount: string;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  tags: string;
}):
  | { error: string }
  | {
      data: {
        name: string;
        amount: number;
        currency: CurrencyCode;
        startDate: string | null;
        endDate: string | null;
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

  if (!currencies.includes(data.currency as CurrencyCode)) {
    return { error: "invalid currency" };
  }

  const amount = parseDollarsToCents(data.amount);
  if (amount === null || amount <= 0) {
    return { error: "invalid amount" };
  }

  const hasStart = data.startDate != null;
  const hasEnd = data.endDate != null;

  if (hasStart !== hasEnd) {
    return { error: "dated budgets require both start and end dates" };
  }

  if (hasStart && hasEnd && data.endDate! < data.startDate!) {
    return { error: "end date must be on or after start date" };
  }

  return {
    data: {
      name,
      amount,
      currency: data.currency as CurrencyCode,
      startDate: data.startDate,
      endDate: data.endDate,
      tags,
    },
  };
}

export async function createBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const result = validateBudgetInput({
    name: String(formData.get("name") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    startDate: parseOptionalDate(formData.get("startDate")),
    endDate: parseOptionalDate(formData.get("endDate")),
    tags: String(formData.get("tags") ?? ""),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  try {
    await createBudget(result.data);
    revalidateBudgetPaths();
    return { success: true };
  } catch {
    return { error: "failed to create budget" };
  }
}

export async function updateBudgetAction(
  id: number,
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const result = validateBudgetInput({
    name: String(formData.get("name") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    startDate: parseOptionalDate(formData.get("startDate")),
    endDate: parseOptionalDate(formData.get("endDate")),
    tags: String(formData.get("tags") ?? ""),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  try {
    const updated = await updateBudget(id, result.data);
    if (!updated) {
      return { error: "budget not found" };
    }
    revalidateBudgetPaths();
    return { success: true };
  } catch {
    return { error: "failed to update budget" };
  }
}

export async function deleteBudgetAction(
  id: number,
): Promise<BudgetFormState> {
  try {
    await deleteBudget(id);
    revalidateBudgetPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("expenses")) {
      return { error: "cannot delete budget with recorded expenses" };
    }
    return { error: "failed to delete budget" };
  }
}

export async function addBudgetExpenseAction(
  budgetId: number,
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const budget = await getBudgetByIdWithTags(budgetId);
  if (!budget) {
    return { error: "budget not found" };
  }

  const amount = parseDollarsToCents(String(formData.get("amount") ?? ""));
  if (amount === null || amount <= 0) {
    return { error: "invalid amount" };
  }

  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "invalid date" };
  }

  const remaining = budget.amount - budget.spent;
  if (amount > remaining) {
    return { error: "amount exceeds remaining budget" };
  }

  const period = await getCurrentPayPeriod();
  if (!period) {
    return { error: "set a primary pay schedule in settings first" };
  }

  if (!isDateInPeriod(date, period)) {
    return { error: "date must fall within the current pay period" };
  }

  const today = todayIso();
  const dated = isDatedBudget(budget);

  if (dated) {
    if (today < budget.startDate!) {
      return { error: "spending unlocks on the budget start date" };
    }
    if (date < budget.startDate! || date > budget.endDate!) {
      return { error: "date must fall within the budget period" };
    }
  }

  const nameField = String(formData.get("name") ?? "").trim();
  const name = dated
    ? nameField || budget.name
    : nameField || budget.name;

  if (!name) {
    return { error: "name is required" };
  }

  try {
    await createBudgetExpense(budgetId, {
      name,
      amount,
      currency: budget.currency,
      date,
      isDatedBudget: dated,
    });
    revalidateBudgetPaths();
    return { success: true };
  } catch {
    return { error: "failed to add expense" };
  }
}

export async function deleteBudgetExpenseAction(
  id: number,
): Promise<BudgetFormState> {
  try {
    const deleted = await deleteBudgetExpense(id);
    if (!deleted) {
      return { error: "expense not found" };
    }
    revalidateBudgetPaths();
    return { success: true };
  } catch {
    return { error: "failed to delete expense" };
  }
}
