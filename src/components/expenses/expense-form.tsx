"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createExpenseAction,
  type ExpenseFormState,
} from "@/lib/actions/expenses";
import {
  currencies,
  type CurrencyCode,
} from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { TagInput } from "./tag-input";

const initialState: ExpenseFormState = {};

interface ExpenseFormProps {
  periodStartDate: string;
  periodEndDate: string;
  defaultDate: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function ExpenseForm({
  periodStartDate,
  periodEndDate,
  defaultDate,
  onCancel,
  onSuccess,
}: ExpenseFormProps) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("usd");
  const [date, setDate] = useState(defaultDate);
  const [isSubscription, setIsSubscription] = useState(false);

  const [state, formAction, pending] = useActionState(
    createExpenseAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      setName("");
      setTags("");
      setAmount("");
      setCurrency("usd");
      setDate(defaultDate);
      setIsSubscription(false);
      onSuccess?.();
    }
  }, [state.success, defaultDate, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="oneoff-name" className="mb-2 block font-mono text-xs text-muted">
          name:
        </label>
        <Input
          id="oneoff-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Groceries"
          required
        />
      </div>

      <TagInput id="oneoff-tags" value={tags} onChange={setTags} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="oneoff-amount" className="mb-2 block font-mono text-xs text-muted">
            amount:
          </label>
          <Input
            id="oneoff-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="45.00"
            required
          />
        </div>

        <div>
          <label htmlFor="oneoff-currency" className="mb-2 block font-mono text-xs text-muted">
            currency:
          </label>
          <select
            id="oneoff-currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className={cn(
              "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent",
            )}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="oneoff-date" className="mb-2 block font-mono text-xs text-muted">
          date:
        </label>
        <Input
          id="oneoff-date"
          name="date"
          type="date"
          value={date}
          min={periodStartDate}
          max={periodEndDate}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <label className="flex items-center gap-2 font-mono text-sm text-text">
        <input
          type="checkbox"
          name="isSubscription"
          checked={isSubscription}
          onChange={(e) => setIsSubscription(e.target.checked)}
          className="accent-accent"
        />
        subscription
      </label>

      {state.error && (
        <p className="font-mono text-xs text-danger">{state.error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "saving..." : "add expense"}
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
