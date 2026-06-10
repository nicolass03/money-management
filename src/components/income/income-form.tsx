"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createIncomeAction,
  updateIncomeAction,
  type IncomeFormState,
} from "@/lib/actions/income";
import { currencies, type CurrencyCode, type Income } from "@/lib/db/schema";
import { cn, formatCentsAsDollarsInput } from "@/lib/utils";

const initialState: IncomeFormState = {};

interface IncomeFormProps {
  entry?: Income;
  defaultDate?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function IncomeForm({
  entry,
  defaultDate,
  onCancel,
  onSuccess,
}: IncomeFormProps) {
  const isEditing = Boolean(entry);
  const [name, setName] = useState(entry?.name ?? "");
  const [amount, setAmount] = useState(
    entry ? formatCentsAsDollarsInput(entry.amount) : "",
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    entry?.currency ?? "usd",
  );
  const [date, setDate] = useState(
    entry?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10),
  );

  const action = isEditing
    ? updateIncomeAction.bind(null, entry!.id)
    : createIncomeAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      if (!isEditing) {
        setName("");
        setAmount("");
        setCurrency("usd");
        setDate(defaultDate ?? new Date().toISOString().slice(0, 10));
      }
      onSuccess?.();
    }
  }, [state.success, isEditing, defaultDate, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="income-name"
          className="mb-2 block font-mono text-xs text-muted"
        >
          name:
        </label>
        <Input
          id="income-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Freelance payment"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="income-amount"
            className="mb-2 block font-mono text-xs text-muted"
          >
            amount:
          </label>
          <Input
            id="income-amount"
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
          <label
            htmlFor="income-currency"
            className="mb-2 block font-mono text-xs text-muted"
          >
            currency:
          </label>
          <select
            id="income-currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className={cn(
              "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent focus:shadow-[0_0_8px_rgba(255,255,255,0.1)]",
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
        <label
          htmlFor="income-date"
          className="mb-2 block font-mono text-xs text-muted"
        >
          date:
        </label>
        <Input
          id="income-date"
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {state.error && (
        <p className="font-mono text-xs text-danger">{state.error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {pending ? "saving..." : isEditing ? "update" : "add income"}
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
