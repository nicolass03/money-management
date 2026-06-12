"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createBudgetAction,
  updateBudgetAction,
  type BudgetFormState,
} from "@/lib/actions/budgets";
import { formatCurrencyLabel } from "@/lib/currency/types";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import {
  currencies,
  type CurrencyCode,
  type BudgetWithTags,
} from "@/lib/db/schema";
import { formatTagNames } from "@/lib/expenses/tag-utils";
import { cn, formatCentsAsDollarsInput } from "@/lib/utils";
import { TagInput } from "@/components/expenses/tag-input";

const initialState: BudgetFormState = {};

interface BudgetFormProps extends MoneyDisplayContext {
  budget?: BudgetWithTags;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function BudgetForm({
  budget,
  onCancel,
  onSuccess,
}: BudgetFormProps) {
  const isEditing = Boolean(budget);
  const [name, setName] = useState(budget?.name ?? "");
  const [tags, setTags] = useState(budget ? formatTagNames(budget.tags) : "");
  const [amount, setAmount] = useState(
    budget ? formatCentsAsDollarsInput(budget.amount) : "",
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    budget?.currency ?? "usd",
  );
  const [startDate, setStartDate] = useState(budget?.startDate ?? "");
  const [endDate, setEndDate] = useState(budget?.endDate ?? "");
  const [dated, setDated] = useState(Boolean(budget?.startDate));

  const action = isEditing
    ? updateBudgetAction.bind(null, budget!.id)
    : createBudgetAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  function handleDatedToggle(checked: boolean) {
    setDated(checked);
    if (!checked) {
      setStartDate("");
      setEndDate("");
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="budget-name" className="mb-2 block font-mono text-xs text-muted">
          name:
        </label>
        <Input
          id="budget-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Summer trip"
          required
        />
      </div>

      <TagInput id="budget-tags" value={tags} onChange={setTags} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="budget-amount" className="mb-2 block font-mono text-xs text-muted">
            amount:
          </label>
          <Input
            id="budget-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1500.00"
            required
          />
        </div>

        <div>
          <label htmlFor="budget-currency" className="mb-2 block font-mono text-xs text-muted">
            currency:
          </label>
          <select
            id="budget-currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className={cn(
              "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent",
            )}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {formatCurrencyLabel(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 font-mono text-xs text-muted">
          <input
            type="checkbox"
            checked={dated}
            onChange={(e) => handleDatedToggle(e.target.checked)}
            className="accent-accent"
          />
          dated budget (start + end required)
        </label>
        {dated && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="budget-start" className="mb-2 block font-mono text-xs text-muted">
                start date:
              </label>
              <Input
                id="budget-start"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required={dated}
              />
            </div>
            <div>
              <label htmlFor="budget-end" className="mb-2 block font-mono text-xs text-muted">
                end date:
              </label>
              <Input
                id="budget-end"
                name="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required={dated}
              />
            </div>
          </div>
        )}
        <p className="mt-2 font-mono text-xs text-muted">
          {dated
            ? "full total shows on projections until the last day, then actual spent"
            : "no projection until you spend — expenses appear on ~/expenses"}
        </p>
      </div>

      {state.error && (
        <p className="font-mono text-xs text-danger">{state.error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {pending ? "saving..." : isEditing ? "update" : "add budget"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            cancel
          </Button>
        )}
      </div>
    </form>
  );
}
