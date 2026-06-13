import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateExpense } from "@/lib/mutations/expenses";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { cn } from "@/lib/utils";
import { TagInput } from "./tag-input";

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
  const [error, setError] = useState("");

  const createExpense = useCreateExpense();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = await createExpense.mutateAsync({
      name,
      tags,
      amount,
      currency,
      date,
      isSubscription,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
    setTags("");
    setAmount("");
    setCurrency("usd");
    setDate(defaultDate);
    setIsSubscription(false);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="oneoff-name" className="mb-2 block font-mono text-xs text-muted">
          name:
        </label>
        <Input
          id="oneoff-name"
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
        <label htmlFor="oneoff-date" className="mb-2 block font-mono text-xs text-muted">
          date:
        </label>
        <Input
          id="oneoff-date"
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
          checked={isSubscription}
          onChange={(e) => setIsSubscription(e.target.checked)}
          className="accent-accent"
        />
        subscription
      </label>

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" loading={createExpense.isPending}>
          {createExpense.isPending ? "saving..." : "add expense"}
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
