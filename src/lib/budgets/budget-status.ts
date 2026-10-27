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
