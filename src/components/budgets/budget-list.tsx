"use client";

import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { BudgetWithTags, ExpenseWithTags } from "@/lib/types/domain";
import { getBudgetStatus } from "@/lib/budgets/budget-status";
import { BudgetCard } from "./budget-card";

interface BudgetListProps extends MoneyDisplayContext {
  budgets: BudgetWithTags[];
  budgetExpenses: Record<string, ExpenseWithTags[]>;
}

const GROUP_ORDER = [
  "active",
  "upcoming",
  "open",
  "ended",
  "depleted",
] as const;

const GROUP_LABELS: Record<(typeof GROUP_ORDER)[number], string> = {
  active: "active",
  upcoming: "upcoming",
  open: "open-ended",
  ended: "ended",
  depleted: "depleted",
};

export function BudgetList({
  budgets,
  budgetExpenses,
  displayCurrency,
  rates,
}: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        {"> no budgets yet. add one above."}
      </p>
    );
  }

  const grouped = new Map<string, BudgetWithTags[]>();
  for (const budget of budgets) {
    const status = getBudgetStatus(budget);
    const list = grouped.get(status) ?? [];
    list.push(budget);
    grouped.set(status, list);
  }

  return (
    <div className="space-y-8">
      {GROUP_ORDER.map((status) => {
        const items = grouped.get(status);
        if (!items?.length) {
          return null;
        }

        return (
          <section key={status}>
            <p className="mb-3 font-mono text-xs text-muted">
              {`// ${GROUP_LABELS[status]}`}
            </p>
            <div className="space-y-4">
              {items.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  expenses={budgetExpenses[budget.id] ?? []}
                  displayCurrency={displayCurrency}
                  rates={rates}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
