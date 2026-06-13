import type { ExpensePeriodKey } from "@/lib/types/domain";

export type { ExpensePeriodKey } from "@/lib/types/domain";

export const EXPENSE_PERIOD_OPTIONS: { key: ExpensePeriodKey; label: string }[] = [
  { key: "last-period", label: "last period" },
  { key: "last-month", label: "last month" },
  { key: "last-3-months", label: "last 3 months" },
];
