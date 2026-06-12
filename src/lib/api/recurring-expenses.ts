import type {
  CurrencyCode,
  PayFrequency,
  RecurringExpenseWithTags,
} from "@/lib/types/domain";
import { apiFetch } from "./client";

export interface RecurringExpenseInput {
  name: string;
  anchorDate: string;
  frequency: PayFrequency;
  amount: number;
  currency: CurrencyCode;
  tags: string[];
  isSubscription: boolean;
  lastPaymentDate: string | null;
}

export async function getRecurringExpenses(): Promise<RecurringExpenseWithTags[]> {
  return apiFetch<RecurringExpenseWithTags[]>("/api/v1/recurring-expenses");
}

export async function getRecurringExpenseById(
  id: string,
): Promise<RecurringExpenseWithTags | null> {
  try {
    return await apiFetch<RecurringExpenseWithTags>(
      `/api/v1/recurring-expenses/${id}`,
    );
  } catch {
    return null;
  }
}

export async function createRecurringExpense(
  data: RecurringExpenseInput,
): Promise<RecurringExpenseWithTags> {
  return apiFetch<RecurringExpenseWithTags>("/api/v1/recurring-expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRecurringExpense(
  id: string,
  data: RecurringExpenseInput,
): Promise<RecurringExpenseWithTags | null> {
  try {
    return await apiFetch<RecurringExpenseWithTags>(
      `/api/v1/recurring-expenses/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  } catch {
    return null;
  }
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  await apiFetch(`/api/v1/recurring-expenses/${id}`, { method: "DELETE" });
}
