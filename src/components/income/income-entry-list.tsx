"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CardListSkeleton } from "@/components/ui/list-skeletons";
import { MoneyText } from "@/components/layout/privacy-mode";
import {
  useDeleteIncome,
  useUpdateIncomeAmount,
} from "@/lib/mutations/income";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { Income } from "@/lib/types/domain";
import { isManualIncome } from "@/lib/income/filter-income-entries";
import { formatCentsAsDollarsInput, formatDate } from "@/lib/utils";
import { IncomeForm } from "./income-form";

interface IncomeEntryListProps extends MoneyDisplayContext {
  entries: Income[];
  loading?: boolean;
}

function IncomeAmountEditor({
  incomeId,
  initialAmount,
  onDone,
}: {
  incomeId: string;
  initialAmount: number;
  onDone: () => void;
}) {
  const { t } = useTranslation("common");
  const [amount, setAmount] = useState(formatCentsAsDollarsInput(initialAmount));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const updateAmount = useUpdateIncomeAmount();

  function handleSave() {
    startTransition(async () => {
      const result = await updateAmount.mutateAsync({ id: incomeId, amount });
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      onDone();
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Input
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-8 w-28 px-2 text-right"
      />
      <Button size="sm" loading={pending} onClick={handleSave}>
        {pending ? t("saving") : t("save")}
      </Button>
      <Button size="sm" variant="ghost" onClick={onDone}>
        {t("cancel")}
      </Button>
      {error && <span className="font-mono text-xs text-danger">{error}</span>}
    </div>
  );
}

export function IncomeEntryList({
  entries,
  loading = false,
  displayCurrency,
  rates,
}: IncomeEntryListProps) {
  const { t } = useTranslation(["income", "common"]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const deleteIncome = useDeleteIncome();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteIncome.mutateAsync(id);
      if (editingId === id) {
        setEditingId(null);
      }
    });
  }

  if (loading) {
    return <CardListSkeleton count={3} label={t("income:loadingEntries")} />;
  }

  if (entries.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        {t("income:emptyEntries")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const manual = isManualIncome(entry);

        if (manual && editingId === entry.id) {
          return (
            <Card key={entry.id}>
              <IncomeForm
                entry={entry}
                onCancel={() => setEditingId(null)}
                onSuccess={() => setEditingId(null)}
              />
            </Card>
          );
        }

        return (
          <Card key={entry.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-text">{entry.name}</p>
                  {!manual && (
                    <Badge variant="default">{t("income:badgeScheduled")}</Badge>
                  )}
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  {formatDate(entry.date)} {"//"} {entry.source}
                </p>
              </div>
              <span className="font-mono text-sm text-success">
                +
                <MoneyText
                  value={formatMoney(
                    entry.amount,
                    entry.currency,
                    displayCurrency,
                    rates,
                  )}
                />
              </span>
            </div>

            {!manual && editingId === entry.id ? (
              <IncomeAmountEditor
                incomeId={entry.id}
                initialAmount={entry.amount}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(entry.id)}
                >
                  {manual ? t("common:edit") : t("income:editAmount")}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={pending}
                  onClick={() => handleDelete(entry.id)}
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
