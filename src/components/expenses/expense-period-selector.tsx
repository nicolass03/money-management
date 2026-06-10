"use client";

import { Button } from "@/components/ui/button";
import {
  EXPENSE_PERIOD_OPTIONS,
  type ExpensePeriodKey,
} from "@/lib/expenses/expense-period-range";
import { cn } from "@/lib/utils";

interface ExpensePeriodSelectorProps {
  value: ExpensePeriodKey;
  onChange: (value: ExpensePeriodKey) => void;
  className?: string;
}

export function ExpensePeriodSelector({
  value,
  onChange,
  className,
}: ExpensePeriodSelectorProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="font-mono text-xs text-muted">period:</span>
      {EXPENSE_PERIOD_OPTIONS.map((option) => (
        <Button
          key={option.key}
          size="sm"
          variant={value === option.key ? "primary" : "ghost"}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
