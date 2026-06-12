import type { Expense } from "@/lib/types/domain";

export function recurringDueDate(expense: Pick<Expense, "date" | "scheduledDate">): string {
  return expense.scheduledDate ?? expense.date;
}

export function materializedRecurringKey(recurringId: string, dueDate: string): string {
  return `${recurringId}:${dueDate}`;
}

export function buildRecurringMaterializedSet(
  expenseList: Pick<Expense, "recurringId" | "date" | "scheduledDate">[],
): Set<string> {
  const materialized = new Set<string>();

  for (const expense of expenseList) {
    if (expense.recurringId != null) {
      materialized.add(
        materializedRecurringKey(expense.recurringId, recurringDueDate(expense)),
      );
    }
  }

  return materialized;
}

export function buildPlannedMaterializedSet(
  expenseList: Pick<Expense, "plannedExpenseId">[],
): Set<string> {
  const materialized = new Set<string>();

  for (const expense of expenseList) {
    if (expense.plannedExpenseId != null) {
      materialized.add(expense.plannedExpenseId);
    }
  }

  return materialized;
}

export function isRecurringOccurrenceMaterialized(
  materialized: Set<string>,
  recurringId: string,
  dueDate: string,
): boolean {
  return materialized.has(materializedRecurringKey(recurringId, dueDate));
}

export function isPlannedExpenseMaterialized(
  materialized: Set<string>,
  plannedExpenseId: string,
): boolean {
  return materialized.has(plannedExpenseId);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}
