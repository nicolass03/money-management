"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import {
  deleteExpenseAction,
  updateExpenseAmountAction,
} from "@/lib/actions/expenses";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { CurrencyCode, IncomePaySchedule } from "@/lib/db/schema";
import type {
  CurrentPeriodExpenses as CurrentPeriodData,
  ProjectionExpenseItem,
} from "@/lib/projections/build-projection";
import { cn, formatCentsAsDollarsInput, formatDate } from "@/lib/utils";
import { ExpenseForm } from "./expense-form";
import { TagList } from "./tag-input";

interface CurrentPeriodExpensesProps extends MoneyDisplayContext {
  primarySchedule: IncomePaySchedule | null;
  periodData: CurrentPeriodData | null;
}

function formatPeriodRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

function ExpenseAmountEditor({
  expenseId,
  initialAmount,
  displayCurrency,
  rates,
  onDone,
}: {
  expenseId: number;
  initialAmount: number;
  displayCurrency: CurrencyCode;
  rates: MoneyDisplayContext["rates"];
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(formatCentsAsDollarsInput(initialAmount));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    const formData = new FormData();
    formData.set("amount", amount);
    startTransition(async () => {
      const result = await updateExpenseAmountAction(expenseId, {}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      onDone();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-8 w-24 px-2 text-right"
      />
      <Button size="sm" loading={pending} onClick={handleSave}>
        {pending ? "saving..." : "save"}
      </Button>
      <Button size="sm" variant="ghost" onClick={onDone}>
        cancel
      </Button>
      {error && (
        <span className="font-mono text-xs text-danger">{error}</span>
      )}
    </div>
  );
}

function ExpenseRow({
  item,
  editingId,
  setEditingId,
  formatDisplay,
  displayCurrency,
  rates,
  onDelete,
  deletePending,
}: {
  item: ProjectionExpenseItem;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  formatDisplay: (amount: number) => string;
  displayCurrency: CurrencyCode;
  rates: MoneyDisplayContext["rates"];
  onDelete: (id: number) => void;
  deletePending: boolean;
}) {
  const key = item.id ?? `proj-${item.recurringId}-${item.date}`;
  const canEdit = item.id != null && !item.projected;

  return (
    <div
      key={key}
      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="font-mono text-sm text-text">{item.name}</p>
          {item.isSubscription && (
            <Badge variant="default">subscription</Badge>
          )}
        </div>
        <p className="font-mono text-xs text-muted">
          {formatDate(item.date)} {"//"} <TagList tags={item.tags} />
          {item.projected ? " // projected" : " // actual"}
        </p>
      </div>
      <div className="text-right">
        {canEdit && editingId === item.id ? (
          <ExpenseAmountEditor
            expenseId={item.id!}
            initialAmount={item.amount}
            displayCurrency={displayCurrency}
            rates={rates}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <>
            <div className="flex items-center justify-end gap-2">
              <span className="font-mono text-sm text-danger">
                -{formatDisplay(item.convertedAmount)}
              </span>
              {canEdit && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn("h-7 px-2 text-xs")}
                    onClick={() => setEditingId(item.id!)}
                  >
                    edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className={cn("h-7 px-2 text-xs")}
                    loading={deletePending}
                    onClick={() => onDelete(item.id!)}
                  >
                    {deletePending ? "deleting..." : "delete"}
                  </Button>
                </>
              )}
            </div>
            {item.currency !== displayCurrency && (
              <p className="font-mono text-xs text-muted">
                {formatMoney(item.amount, item.currency as CurrencyCode)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ExpenseGroup({
  title,
  items,
  editingId,
  setEditingId,
  formatDisplay,
  displayCurrency,
  rates,
  onDelete,
  deletePending,
}: {
  title: string;
  items: ProjectionExpenseItem[];
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  formatDisplay: (amount: number) => string;
  displayCurrency: CurrencyCode;
  rates: MoneyDisplayContext["rates"];
  onDelete: (id: number) => void;
  deletePending: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  const subtotal = items.reduce((sum, item) => sum + item.convertedAmount, 0);

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-xs text-muted">{title}</p>
        <span className="font-mono text-xs text-danger">
          -{formatDisplay(subtotal)}
        </span>
      </div>
      <div className="divide-y divide-border/60">
        {items.map((item) => (
          <ExpenseRow
            key={item.id ?? `proj-${item.recurringId}-${item.date}`}
            item={item}
            editingId={editingId}
            setEditingId={setEditingId}
            formatDisplay={formatDisplay}
            displayCurrency={displayCurrency}
            rates={rates}
            onDelete={onDelete}
            deletePending={deletePending}
          />
        ))}
      </div>
    </div>
  );
}

export function CurrentPeriodExpenses({
  primarySchedule,
  periodData,
  displayCurrency,
  rates,
}: CurrentPeriodExpensesProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  function handleDelete(id: number) {
    startDeleteTransition(async () => {
      await deleteExpenseAction(id);
      if (editingId === id) {
        setEditingId(null);
      }
    });
  }

  function formatDisplay(amount: number) {
    return formatMoney(amount, displayCurrency, displayCurrency, rates);
  }

  const total =
    periodData?.items.reduce((sum, item) => sum + item.convertedAmount, 0) ?? 0;

  const subscriptions =
    periodData?.items.filter((item) => item.isSubscription) ?? [];
  const otherExpenses =
    periodData?.items.filter((item) => !item.isSubscription) ?? [];

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title="current_period"
          subtitle={
            periodData
              ? `${formatPeriodRange(periodData.period.startDate, periodData.period.endDate)} // payday ${formatDate(periodData.period.payDate)}`
              : "planned spend for the active pay period"
          }
          className="mb-0"
        />
        <div className="flex items-center gap-3">
          {periodData && periodData.items.length > 0 && (
            <Badge variant="accent">{formatDisplay(total)}</Badge>
          )}
          {primarySchedule && periodData && (
            <Button
              size="sm"
              variant={showAdd ? "ghost" : "primary"}
              onClick={() => setShowAdd((open) => !open)}
            >
              {showAdd ? "cancel" : "+ add expense"}
            </Button>
          )}
        </div>
      </div>

      {showAdd && periodData && (
        <Card className="mb-4">
          <ExpenseForm
            periodStartDate={periodData.period.startDate}
            periodEndDate={periodData.period.endDate}
            defaultDate={today}
            onCancel={() => setShowAdd(false)}
            onSuccess={() => setShowAdd(false)}
          />
        </Card>
      )}

      <Card>
        {!primarySchedule ? (
          <p className="font-mono text-sm text-muted">
            {"> set a primary pay schedule in "}
            <Link
              href="/settings"
              className="text-accent hover:text-accent-glow"
            >
              ~/settings
            </Link>
            {" to define the current period."}
          </p>
        ) : periodData?.items.length === 0 ? (
          <p className="font-mono text-sm text-muted">
            {"> no expenses in this period."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            <ExpenseGroup
              title="subscriptions"
              items={subscriptions}
              editingId={editingId}
              setEditingId={setEditingId}
              formatDisplay={formatDisplay}
              displayCurrency={displayCurrency}
              rates={rates}
              onDelete={handleDelete}
              deletePending={deletePending}
            />
            <ExpenseGroup
              title="other_expenses"
              items={otherExpenses}
              editingId={editingId}
              setEditingId={setEditingId}
              formatDisplay={formatDisplay}
              displayCurrency={displayCurrency}
              rates={rates}
              onDelete={handleDelete}
              deletePending={deletePending}
            />
          </div>
        )}
      </Card>
    </section>
  );
}
