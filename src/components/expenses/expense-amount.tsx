import type { FormattedExpenseAmount } from "@/lib/currency/expense-display";
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
  return (
    <span className={cn("font-mono", className)}>
      {sign}
      {amount.primary}
      {amount.parenthetical && (
        <span className="text-muted"> ({amount.parenthetical})</span>
      )}
    </span>
  );
}
