
import type {
  CurrencyCode,
  Expense,
  PlannedExpenseWithTags,
} from "@/lib/types/domain";
import { localTodayIso } from "@/lib/date/local-today";
import { apiFetch } from "./client";

export interface PlannedExpenseInput {
  name: string;
  date: string | null;
  amount: number;
  currency: CurrencyCode;
  tags: string[];
  accountId?: string | null;
}

export async function getPlannedExpenses(): Promise<PlannedExpenseWithTags[]> {
  return apiFetch<PlannedExpenseWithTags[]>("/api/v1/planned-expenses");
}

export async function createPlannedExpense(
  data: PlannedExpenseInput,
): Promise<PlannedExpenseWithTags> {
  return apiFetch<PlannedExpenseWithTags>("/api/v1/planned-expenses", {
    method: "POST",
    body: JSON.stringify({ ...data, asOf: localTodayIso() }),
  });
}

export async function updatePlannedExpense(
  id: string,
  data: PlannedExpenseInput,
): Promise<PlannedExpenseWithTags> {
  return apiFetch<PlannedExpenseWithTags>(
    `/api/v1/planned-expenses/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

/** Records the one-time expense as paid today (full payment; the amount may differ). */
export async function payPlannedExpense(id: string, amount: number): Promise<Expense> {
  return apiFetch<Expense>(`/api/v1/planned-expenses/${id}/pay`, {
    method: "POST",
    body: JSON.stringify({ amount, asOf: localTodayIso() }),
  });
}

export async function deletePlannedExpense(id: string): Promise<void> {
  await apiFetch(`/api/v1/planned-expenses/${id}`, { method: "DELETE" });
}
