"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BudgetTab = "active" | "history";

interface BudgetTabSelectorProps {
  value: BudgetTab;
  onChange: (value: BudgetTab) => void;
  className?: string;
}

export function BudgetTabSelector({
  value,
  onChange,
  className,
}: BudgetTabSelectorProps) {
  const { t } = useTranslation("budgets");
  const options: { key: BudgetTab; label: string }[] = [
    { key: "active", label: t("tabActive") },
    { key: "history", label: t("tabHistory") },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
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
