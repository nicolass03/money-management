"use client";

import { usePrivacyMode } from "@/components/layout/privacy-mode";
import type { FormattedExpenseAmount } from "@/lib/currency/expense-display";
import { maskNumericValue } from "@/lib/privacy/mask";
import { cn } from "@/lib/utils";

interface ExpenseAmountProps {
  amount: FormattedExpenseAmount;
  className?: string;
  sign?: "-" | "";
}

export function ExpenseAmount({
  amount,
  className,
  sign = "-",
}: ExpenseAmountProps) {
  const { privacyMode } = usePrivacyMode();

  const primary = privacyMode
    ? maskNumericValue(amount.primary)
    : amount.primary;
  const parenthetical =
    amount.parenthetical &&
    (privacyMode
      ? maskNumericValue(amount.parenthetical)
      : amount.parenthetical);

  return (
    <span className={cn("font-mono", className)}>
      {sign}
      {primary}
      {parenthetical && (
        <span className="text-muted"> ({parenthetical})</span>
      )}
    </span>
  );
}
