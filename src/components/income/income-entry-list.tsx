"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardListSkeleton } from "@/components/ui/list-skeletons";
import { MoneyText } from "@/components/layout/privacy-mode";
import { useDeleteIncome } from "@/lib/mutations/income";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { Income } from "@/lib/types/domain";
import { isManualIncome } from "@/lib/income/filter-income-entries";
import { formatDate } from "@/lib/utils";
import { IncomeForm } from "./income-form";

interface IncomeEntryListProps extends MoneyDisplayContext {
  entries: Income[];
  loading?: boolean;
}

export function IncomeEntryList({
  entries,
  loading = false,
  displayCurrency,
  rates,
}: IncomeEntryListProps) {
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
    return <CardListSkeleton count={3} label="loading income entries" />;
  }

  if (entries.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        {"> no income entries yet. add one above."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const canEdit = isManualIncome(entry);

        if (editingId === entry.id) {
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
                  {!canEdit && <Badge variant="default">scheduled</Badge>}
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

            {canEdit && (
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(entry.id)}
                >
                  edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={pending}
                  onClick={() => handleDelete(entry.id)}
                >
                  {pending ? "deleting..." : "delete"}
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
