"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { MoneyText } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { BudgetWithTags, ExpenseWithTags } from "@/lib/types/domain";
import { BudgetForm } from "./budget-form";
import { BudgetList } from "./budget-list";

interface BudgetsSectionProps extends MoneyDisplayContext {
  budgets: BudgetWithTags[];
  budgetExpenses: Record<string, ExpenseWithTags[]>;
  budgetsLoading?: boolean;
  expensesLoading?: boolean;
}

export function BudgetsSection({
  budgets,
  budgetExpenses,
  budgetsLoading = false,
  expensesLoading = false,
  displayCurrency,
  rates,
}: BudgetsSectionProps) {
  const [showAdd, setShowAdd] = useState(budgets.length === 0);
  const ctx = { displayCurrency, rates };
  const listLoading = budgetsLoading || expensesLoading;

  const activeTotal = budgets.reduce(
    (sum, budget) => sum + toDisplayAmount(budget.amount, budget.currency, ctx),
    0,
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title="budgets"
          subtitle="spending envelopes for trips, projects, and goals"
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-3">
          {listLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            budgets.length > 0 && (
              <Badge variant="accent">
                <MoneyText
                  value={formatMoney(
                    activeTotal,
                    displayCurrency,
                    displayCurrency,
                    rates,
                  )}
                />
                total allocated
              </Badge>
            )
          )}
          {!listLoading && (
            <Button
              size="sm"
              variant={showAdd ? "ghost" : "primary"}
              onClick={() => setShowAdd((open) => !open)}
            >
              {showAdd ? "cancel" : "+ add budget"}
            </Button>
          )}
        </div>
      </div>

      {showAdd && !listLoading && (
        <Card className="mb-4">
          <p className="mb-4 font-mono text-xs text-muted">
            set a total and optional date range — dated budgets reserve cash on
            projections
          </p>
          <BudgetForm
            displayCurrency={displayCurrency}
            rates={rates}
            onCancel={
              budgets.length > 0 ? () => setShowAdd(false) : undefined
            }
            onSuccess={() => setShowAdd(false)}
          />
        </Card>
      )}

      <BudgetList
        budgets={budgets}
        budgetExpenses={budgetExpenses}
        loading={listLoading}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </section>
  );
}
