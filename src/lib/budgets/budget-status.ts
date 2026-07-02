import type { BudgetWithTags } from "@/lib/types/domain";
import { localTodayIso } from "@/lib/date/local-today";

export type BudgetStatus =
  | "upcoming"
  | "active"
  | "ended"
  | "open"
  | "depleted";

export function isDatedBudget(budget: {
  startDate: string | null;
  endDate: string | null;
}): boolean {
  return budget.startDate != null && budget.endDate != null;
}

export function getBudgetStatus(
  budget: Pick<
    BudgetWithTags,
    "startDate" | "endDate" | "amount" | "spent" | "completedAt"
  >,
  today: string = localTodayIso(),
): BudgetStatus {
  if (budget.completedAt != null) {
    return "ended";
  }

  if (budget.spent >= budget.amount) {
    return "depleted";
  }

  if (!isDatedBudget(budget)) {
    return "open";
  }

  if (today < budget.startDate!) {
    return "upcoming";
  }

  if (today > budget.endDate!) {
    return "ended";
  }

  return "active";
}

export function budgetOverlapsPeriod(
  budget: { startDate: string | null; endDate: string | null },
  period: { startDate: string; endDate: string },
): boolean {
  if (!isDatedBudget(budget)) {
    return false;
  }

  return (
    period.startDate <= budget.endDate! && period.endDate >= budget.startDate!
  );
}

export function getBudgetProjectionAmount(
  budget: {
    amount: number;
    endDate: string | null;
    completedAt?: string | null;
  },
  spent: number,
  today: string,
): number {
  if (budget.completedAt != null) {
    return spent;
  }

  if (!budget.endDate) {
    return 0;
  }

  if (today <= budget.endDate) {
    return budget.amount;
  }

  return spent;
}

export function getBudgetProjectionPeriodDate(
  budget: { startDate: string | null; endDate: string | null },
  today: string,
): string | null {
  if (!isDatedBudget(budget)) {
    return null;
  }

  if (today <= budget.endDate!) {
    return budget.startDate;
  }

  return budget.endDate;
}

export function isBudgetProjectionProjected(
  budget: { startDate: string | null; endDate: string | null },
  today: string,
): boolean {
  if (!isDatedBudget(budget)) {
    return false;
  }

  return today <= budget.endDate! && today < budget.startDate!;
}

export function isBudgetInHistory(
  budget: Pick<BudgetWithTags, "startDate" | "endDate" | "completedAt">,
  today: string = localTodayIso(),
): boolean {
  if (budget.completedAt != null) {
    return true;
  }

  if (!isDatedBudget(budget)) {
    return false;
  }

  return today > budget.endDate!;
}

export function isBudgetFinishable(
  budget: Pick<BudgetWithTags, "startDate" | "endDate" | "completedAt">,
  today: string = localTodayIso(),
): boolean {
  return !isBudgetInHistory(budget, today);
}
