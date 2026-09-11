"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { localTodayIso } from "@/lib/date/local-today";
import {
  useDeletePlannedExpense,
  usePayPlannedExpense,
} from "@/lib/mutations/planned-expenses";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import { formatScheduledExpenseAmount } from "@/lib/currency/expense-display";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { ExpenseAmount } from "./expense-amount";
import type { PlannedExpenseWithTags } from "@/lib/types/domain";
import { TagList } from "./tag-input";
import { formatCentsAsDollarsInput, formatDate } from "@/lib/utils";
import { PlannedExpenseForm } from "./planned-expense-form";

interface PlannedExpenseListProps extends MoneyDisplayContext {
  plannedExpenses: PlannedExpenseWithTags[];
}

export function PlannedExpenseList({
  plannedExpenses,
  displayCurrency,
  rates,
}: PlannedExpenseListProps) {
  const { t } = useTranslation(["expenses", "common"]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const deletePlanned = useDeletePlannedExpense();
  const today = localTodayIso();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deletePlanned.mutateAsync(id);
      if (editingId === id) {
        setEditingId(null);
      }
    });
  }

  if (plannedExpenses.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        {t("expenses:plannedEmptyList")}
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
                  {planned.date ? formatDate(planned.date) : t("expenses:plannedNoDueDate")}{" "}
                  {"//"} <TagList tags={planned.tags} />{" "}
                  {"//"} {formatCurrencyLabel(planned.currency)}
                </p>
                {planned.paid ? (
                  <Badge variant="success" className="mt-2">
                    {t("expenses:plannedPaid")}
                  </Badge>
                ) : (
                  planned.date &&
                  planned.date <= today && (
                    <Badge variant="warning" className="mt-2">
                      {t("expenses:plannedOverdue")}
                    </Badge>
                  )
                )}
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

            {payingId === planned.id ? (
              <PayPlannedForm
                planned={planned}
                onDone={() => setPayingId(null)}
              />
            ) : (
              <div className="mt-4 flex gap-2">
                {!planned.paid && (
                  <Button size="sm" onClick={() => setPayingId(planned.id)}>
                    {t("expenses:payNow")}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(planned.id)}
                >
                  {t("common:edit")}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={pending}
                  onClick={() => handleDelete(planned.id)}
                >
                  {pending ? t("common:deleting") : t("common:delete")}
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/** Inline "pay now": records the full payment today, with the amount editable. */
function PayPlannedForm({
  planned,
  onDone,
}: {
  planned: PlannedExpenseWithTags;
  onDone: () => void;
}) {
  const { t } = useTranslation(["expenses", "common"]);
  const payPlanned = usePayPlannedExpense();
  const [amount, setAmount] = useState(formatCentsAsDollarsInput(planned.amount));
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = await payPlanned.mutateAsync({ id: planned.id, amount });
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <label
        htmlFor={`pay-${planned.id}`}
        className="block font-mono text-xs text-muted"
      >
        {t("expenses:payAmountLabel")} ({formatCurrencyLabel(planned.currency)})
      </label>
      <Input
        id={`pay-${planned.id}`}
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      {error && <p className="font-mono text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={payPlanned.isPending}>
          {t("expenses:confirmPay")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          {t("common:cancel")}
        </Button>
      </div>
    </form>
  );
}
