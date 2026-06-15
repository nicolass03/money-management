"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  getExpensePeriodOptions,
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
  const { t } = useTranslation("expenses");
  const options = getExpensePeriodOptions();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="font-mono text-xs text-muted">{t("periodLabel")}</span>
      {options.map((option) => (
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
