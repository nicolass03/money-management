import type { BudgetWithTags } from "@/lib/types/domain";

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
  budget: Pick<BudgetWithTags, "startDate" | "endDate" | "amount" | "spent">,
  today: string = new Date().toISOString().slice(0, 10),
): BudgetStatus {
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
  budget: { amount: number; endDate: string | null },
  spent: number,
  today: string,
): number {
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
