"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteRecurringExpenseAction } from "@/lib/actions/recurring-expenses";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import { formatScheduledExpenseAmount } from "@/lib/currency/expense-display";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { ExpenseAmount } from "./expense-amount";
import type { RecurringExpenseWithTags } from "@/lib/types/domain";
import { TagList } from "./tag-input";
import {
  formatFrequency,
  getUpcomingPayDates,
  scheduleToInput,
} from "@/lib/income/pay-periods";
import { formatDate } from "@/lib/utils";
import { RecurringExpenseForm } from "./recurring-expense-form";

interface RecurringExpenseListProps extends MoneyDisplayContext {
  recurringExpenses: RecurringExpenseWithTags[];
}

export function RecurringExpenseList({
  recurringExpenses,
  displayCurrency,
  rates,
}: RecurringExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteRecurringExpenseAction(id);
      if (editingId === id) {
        setEditingId(null);
      }
    });
  }

  if (recurringExpenses.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        {"> no recurring expenses yet. add one above."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {recurringExpenses.map((recurring) => {
        const upcoming = getUpcomingPayDates(scheduleToInput(recurring), 2);

        if (editingId === recurring.id) {
          return (
            <Card key={recurring.id}>
              <RecurringExpenseForm
                recurring={recurring}
                displayCurrency={displayCurrency}
                rates={rates}
                onCancel={() => setEditingId(null)}
                onSuccess={() => setEditingId(null)}
              />
            </Card>
          );
        }

        return (
          <Card key={recurring.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-text">{recurring.name}</p>
                  {recurring.isSubscription && (
                    <Badge variant="default">subscription</Badge>
                  )}
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  anchor {formatDate(recurring.anchorDate)} {"//"}{" "}
                  {formatFrequency(recurring.frequency)}
                  {recurring.lastPaymentDate && (
                    <>
                      {" "}
                      {"//"} ends {formatDate(recurring.lastPaymentDate)}
                    </>
                  )}{" "}
                  {"//"} <TagList tags={recurring.tags} /> {"//"}{" "}
                  {formatCurrencyLabel(recurring.currency)}
                </p>
              </div>
              <Badge variant="accent">
                <ExpenseAmount
                  amount={formatScheduledExpenseAmount(
                    recurring.amount,
                    recurring.currency,
                  )}
                  sign=""
                  className="text-sm"
                />
              </Badge>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <p className="font-mono text-xs text-muted">next due dates:</p>
              {upcoming.length === 0 && (
                <p className="mt-2 font-mono text-xs text-muted">
                  {"> no upcoming charges"}
                </p>
              )}
              <ul className="mt-2 space-y-1">
                {upcoming.map((date) => (
                  <li
                    key={date}
                    className="flex items-center justify-between font-mono text-xs text-text"
                  >
                    <span>{formatDate(date)}</span>
                    <ExpenseAmount
                      amount={formatScheduledExpenseAmount(
                        recurring.amount,
                        recurring.currency,
                      )}
                      className="text-xs text-danger"
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingId(recurring.id)}
              >
                edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={pending}
                onClick={() => handleDelete(recurring.id)}
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
