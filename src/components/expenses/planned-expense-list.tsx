"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deletePlannedExpenseAction } from "@/lib/actions/planned-expenses";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import { formatScheduledExpenseAmount } from "@/lib/currency/expense-display";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { ExpenseAmount } from "./expense-amount";
import type { PlannedExpenseWithTags } from "@/lib/db/schema";
import { TagList } from "./tag-input";
import { formatDate } from "@/lib/utils";
import { PlannedExpenseForm } from "./planned-expense-form";

interface PlannedExpenseListProps extends MoneyDisplayContext {
  plannedExpenses: PlannedExpenseWithTags[];
}

export function PlannedExpenseList({
  plannedExpenses,
  displayCurrency,
  rates,
}: PlannedExpenseListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(id: number) {
    startTransition(async () => {
      await deletePlannedExpenseAction(id);
      if (editingId === id) {
        setEditingId(null);
      }
    });
  }

  if (plannedExpenses.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        {"> no planned expenses yet. add one above."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {plannedExpenses.map((planned) => {
        if (editingId === planned.id) {
          return (
            <Card key={planned.id}>
              <PlannedExpenseForm
                planned={planned}
                displayCurrency={displayCurrency}
                rates={rates}
                onCancel={() => setEditingId(null)}
                onSuccess={() => setEditingId(null)}
              />
            </Card>
          );
        }

        return (
          <Card key={planned.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-text">{planned.name}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {formatDate(planned.date)} {"//"} <TagList tags={planned.tags} />{" "}
                  {"//"} {formatCurrencyLabel(planned.currency)}
                </p>
              </div>
              <Badge variant="accent">
                <ExpenseAmount
                  amount={formatScheduledExpenseAmount(
                    planned.amount,
                    planned.currency,
                  )}
                  sign=""
                  className="text-sm"
                />
              </Badge>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingId(planned.id)}
              >
                edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={pending}
                onClick={() => handleDelete(planned.id)}
              >
                {pending ? "deleting..." : "delete"}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
