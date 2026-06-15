"use client";

import { useTranslation } from "react-i18next";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { BudgetWithTags, ExpenseWithTags } from "@/lib/types/domain";
import { CardListSkeleton } from "@/components/ui/list-skeletons";
import { getBudgetStatus } from "@/lib/budgets/budget-status";
import { BudgetCard } from "./budget-card";

interface BudgetListProps extends MoneyDisplayContext {
  budgets: BudgetWithTags[];
  budgetExpenses: Record<string, ExpenseWithTags[]>;
  loading?: boolean;
}

const GROUP_ORDER = [
  "active",
  "upcoming",
  "open",
  "ended",
  "depleted",
] as const;

const GROUP_KEYS: Record<(typeof GROUP_ORDER)[number], string> = {
  active: "groupActive",
  upcoming: "groupUpcoming",
  open: "groupOpenEnded",
  ended: "groupEnded",
  depleted: "groupDepleted",
};

export function BudgetList({
  budgets,
  budgetExpenses,
  loading = false,
  displayCurrency,
  rates,
}: BudgetListProps) {
  const { t } = useTranslation(["budgets", "common"]);

  if (loading) {
    return <CardListSkeleton count={3} label={t("common:loadingBudgets")} />;
  }

  if (budgets.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        {t("budgets:emptyList")}
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
              {`// ${t(`budgets:${GROUP_KEYS[status]}`)}`}
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
