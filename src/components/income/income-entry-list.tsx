"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteIncomeAction } from "@/lib/actions/income";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { Income } from "@/lib/db/schema";
import { isManualIncome } from "@/lib/income/filter-income-entries";
import { formatDate } from "@/lib/utils";
import { IncomeForm } from "./income-form";

interface IncomeEntryListProps extends MoneyDisplayContext {
  entries: Income[];
}

export function IncomeEntryList({
  entries,
  displayCurrency,
  rates,
}: IncomeEntryListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteIncomeAction(id);
      if (editingId === id) {
        setEditingId(null);
      }
    });
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
                {formatMoney(
                  entry.amount,
                  entry.currency,
                  displayCurrency,
                  rates,
                )}
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
