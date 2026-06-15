import i18n from "@/lib/i18n";
import type { ExpensePeriodKey } from "@/lib/types/domain";

export type { ExpensePeriodKey } from "@/lib/types/domain";

const periodKeys: Record<ExpensePeriodKey, string> = {
  "last-period": "periodLastPeriod",
  "last-month": "periodLastMonth",
  "last-3-months": "periodLast3Months",
};

export function getExpensePeriodOptions(): {
  key: ExpensePeriodKey;
  label: string;
}[] {
  return (Object.keys(periodKeys) as ExpensePeriodKey[]).map((key) => ({
    key,
    label: i18n.t(`expenses:${periodKeys[key]}`),
  }));
}
