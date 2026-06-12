import "server-only";

import type { BudgetWithTags, CurrencyCode, ExpenseWithTags } from "@/lib/types/domain";
import { apiFetch } from "./client";

export interface BudgetInput {
  name: string;
  amount: number;
  currency: CurrencyCode;
  startDate: string | null;
  endDate: string | null;
  tags: string[];
}

export interface BudgetExpenseInput {
  name?: string;
  amount: number;
  date: string;
}

export async function getBudgets(): Promise<BudgetWithTags[]> {
  return apiFetch<BudgetWithTags[]>("/api/v1/budgets");
}

export async function getBudgetById(
  id: string,
): Promise<BudgetWithTags | null> {
  try {
    return await apiFetch<BudgetWithTags>(`/api/v1/budgets/${id}`);
  } catch {
    return null;
  }
}

export async function createBudget(
  data: BudgetInput,
): Promise<BudgetWithTags> {
  return apiFetch<BudgetWithTags>("/api/v1/budgets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBudget(
  id: string,
  data: BudgetInput,
): Promise<BudgetWithTags | null> {
  try {
    return await apiFetch<BudgetWithTags>(`/api/v1/budgets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function deleteBudget(id: string): Promise<void> {
  await apiFetch(`/api/v1/budgets/${id}`, { method: "DELETE" });
}

export async function getBudgetExpenses(
  budgetId: string,
): Promise<ExpenseWithTags[]> {
  return apiFetch<ExpenseWithTags[]>(`/api/v1/budgets/${budgetId}/expenses`);
}

export async function createBudgetExpense(
  budgetId: string,
  data: BudgetExpenseInput,
): Promise<ExpenseWithTags> {
  return apiFetch<ExpenseWithTags>(`/api/v1/budgets/${budgetId}/expenses`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteBudgetExpense(
  budgetId: string,
  expenseId: string,
): Promise<void> {
  await apiFetch(`/api/v1/budgets/${budgetId}/expenses/${expenseId}`, {
    method: "DELETE",
  });
}
