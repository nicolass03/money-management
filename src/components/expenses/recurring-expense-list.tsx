"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDeleteRecurringExpense } from "@/lib/mutations/recurring-expenses";
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
  const { t } = useTranslation(["expenses", "common"]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const deleteRecurring = useDeleteRecurringExpense();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteRecurring.mutateAsync(id);
      if (editingId === id) {
        setEditingId(null);
      }
    });
  }

  if (recurringExpenses.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        {t("expenses:recurringEmptyList")}
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
                    <Badge variant="default">
                      {t("expenses:subscription")}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  {t("expenses:metaAnchor", {
                    date: formatDate(recurring.anchorDate),
                    frequency: formatFrequency(recurring.frequency),
                  })}
                  {recurring.lastPaymentDate && (
                    <>
                      {" "}
                      {"//"}{" "}
                      {t("expenses:metaEnds", {
                        date: formatDate(recurring.lastPaymentDate),
                      })}
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
              <p className="font-mono text-xs text-muted">
                {t("expenses:nextDueDates")}
              </p>
              {upcoming.length === 0 && (
                <p className="mt-2 font-mono text-xs text-muted">
                  {t("expenses:noUpcomingCharges")}
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
                {t("common:edit")}
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={pending}
                onClick={() => handleDelete(recurring.id)}
              >
                {pending ? t("common:deleting") : t("common:delete")}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
