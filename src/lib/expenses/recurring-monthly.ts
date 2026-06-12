import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { PayFrequency } from "@/lib/types/constants";
import type { RecurringExpense } from "@/lib/types/domain";

const MONTHLY_MULTIPLIERS: Record<PayFrequency, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  yearly: 1 / 12,
};

export function toMonthlyAmount(
  amount: number,
  frequency: PayFrequency,
): number {
  return Math.round(amount * MONTHLY_MULTIPLIERS[frequency]);
}

export function toMonthlyDisplayAmount(
  recurring: Pick<RecurringExpense, "amount" | "currency" | "frequency">,
  ctx: MoneyDisplayContext,
): number {
  const displayAmount = toDisplayAmount(
    recurring.amount,
    recurring.currency,
    ctx,
  );
  return toMonthlyAmount(displayAmount, recurring.frequency);
}

export function isActiveRecurring(
  recurring: Pick<RecurringExpense, "lastPaymentDate">,
  today: string,
): boolean {
  if (!recurring.lastPaymentDate) {
    return true;
  }
  return today <= recurring.lastPaymentDate;
}
