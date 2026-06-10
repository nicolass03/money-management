"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { RecurringExpenseWithTags } from "@/lib/db/schema";
import { RecurringExpenseForm } from "./recurring-expense-form";
import { RecurringExpenseList } from "./recurring-expense-list";

interface RecurringExpensesProps extends MoneyDisplayContext {
  recurringExpenses: RecurringExpenseWithTags[];
}

export function RecurringExpenses({
  recurringExpenses,
  displayCurrency,
  rates,
}: RecurringExpensesProps) {
  const [showAdd, setShowAdd] = useState(recurringExpenses.length === 0);
  const ctx = { displayCurrency, rates };

  const recurringTotal = recurringExpenses.reduce(
    (sum, recurring) =>
      sum + toDisplayAmount(recurring.amount, recurring.currency, ctx),
    0,
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title="recurring_expenses"
          subtitle="templates charged daily on their due date"
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-3">
          {recurringExpenses.length > 0 && (
            <Badge variant="accent">
              {formatMoney(
                recurringTotal,
                displayCurrency,
                displayCurrency,
                rates,
              )}
              /cycle
            </Badge>
          )}
          <Button
            size="sm"
            variant={showAdd ? "ghost" : "primary"}
            onClick={() => setShowAdd((open) => !open)}
          >
            {showAdd ? "cancel" : "+ add recurring"}
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="mb-4">
          <p className="mb-4 font-mono text-xs text-muted">
            set a due date anchor — charges are created on each due date
          </p>
          <RecurringExpenseForm
            displayCurrency={displayCurrency}
            rates={rates}
            onCancel={
              recurringExpenses.length > 0 ? () => setShowAdd(false) : undefined
            }
            onSuccess={() => setShowAdd(false)}
          />
        </Card>
      )}

      <RecurringExpenseList
        recurringExpenses={recurringExpenses}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </section>
  );
}
