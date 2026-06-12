import "server-only";

import type { CurrencyCode, ExpenseWithTags } from "@/lib/types/domain";
import { apiFetch } from "./client";

export interface CreateExpenseInput {
  name: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  tags: string[];
  isSubscription: boolean;
}

export interface EarlyPayExpenseInput {
  sourceType: "recurring" | "planned";
  scheduledDate: string;
  paidDate: string;
  amount: number;
  currency: CurrencyCode;
  recurringId?: string;
  plannedExpenseId?: string;
}

export async function getExpenses(): Promise<ExpenseWithTags[]> {
  return apiFetch<ExpenseWithTags[]>("/api/v1/expenses");
}

export async function getExpenseById(
  id: string,
): Promise<ExpenseWithTags | null> {
  try {
    return await apiFetch<ExpenseWithTags>(`/api/v1/expenses/${id}`);
  } catch {
    return null;
  }
}

export async function createExpense(
  data: CreateExpenseInput,
): Promise<ExpenseWithTags> {
  return apiFetch<ExpenseWithTags>("/api/v1/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateExpenseAmount(
  id: string,
  amount: number,
): Promise<ExpenseWithTags | null> {
  try {
    return await apiFetch<ExpenseWithTags>(`/api/v1/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ amount }),
    });
  } catch {
    return null;
  }
}

export async function deleteExpense(id: string): Promise<void> {
  await apiFetch(`/api/v1/expenses/${id}`, { method: "DELETE" });
}

export async function earlyPayExpense(
  data: EarlyPayExpenseInput,
): Promise<ExpenseWithTags> {
  return apiFetch<ExpenseWithTags>("/api/v1/expenses/early-pay", {
    method: "POST",
    body: JSON.stringify({
      sourceType: data.sourceType,
      scheduledDate: data.scheduledDate,
      paidDate: data.paidDate,
      amount: data.amount,
      currency: data.currency,
      recurringId: data.recurringId,
      plannedExpenseId: data.plannedExpenseId,
    }),
  });
}
