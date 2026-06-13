import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
} from "@/lib/mutations/recurring-expenses";
import { formatScheduledExpenseAmount } from "@/lib/currency/expense-display";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { ExpenseAmount } from "./expense-amount";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import {
  currencies,
  payFrequencies,
  type CurrencyCode,
  type PayFrequency,
} from "@/lib/types/constants";
import type { RecurringExpenseWithTags } from "@/lib/types/domain";
import { formatFrequency, getUpcomingPayDates } from "@/lib/income/pay-periods";
import { formatTagNames } from "@/lib/expenses/tag-utils";
import {
  cn,
  formatCentsAsDollarsInput,
  formatDate,
  parseDollarsToCents,
} from "@/lib/utils";
import { TagInput } from "./tag-input";


interface RecurringExpenseFormProps extends MoneyDisplayContext {
  recurring?: RecurringExpenseWithTags;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function RecurringExpenseForm({
  recurring,
  onCancel,
  onSuccess,
  displayCurrency,
  rates,
}: RecurringExpenseFormProps) {
  const isEditing = Boolean(recurring);
  const [name, setName] = useState(recurring?.name ?? "");
  const [tags, setTags] = useState(
    recurring ? formatTagNames(recurring.tags) : "",
  );
  const [anchorDate, setAnchorDate] = useState(recurring?.anchorDate ?? "");
  const [frequency, setFrequency] = useState<PayFrequency>(
    recurring?.frequency ?? "monthly",
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    recurring?.currency ?? "usd",
  );
  const [amount, setAmount] = useState(
    recurring ? formatCentsAsDollarsInput(recurring.amount) : "",
  );
  const [isSubscription, setIsSubscription] = useState(
    recurring?.isSubscription ?? false,
  );
  const [lastPaymentDate, setLastPaymentDate] = useState(
    recurring?.lastPaymentDate ?? "",
  );

  const [error, setError] = useState("");

  const createRecurring = useCreateRecurringExpense();
  const updateRecurring = useUpdateRecurringExpense();
  const pending = createRecurring.isPending || updateRecurring.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = {
      name,
      tags,
      anchorDate,
      frequency,
      amount,
      currency,
      isSubscription,
      lastPaymentDate,
    };
    const result = isEditing
      ? await updateRecurring.mutateAsync({ id: recurring!.id, input })
      : await createRecurring.mutateAsync(input);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
  }

  const previewDates =
    anchorDate && payFrequencies.includes(frequency)
      ? getUpcomingPayDates(
          {
            anchorDate,
            frequency,
            lastPaymentDate: lastPaymentDate || null,
          },
          4,
        )
      : [];
  const previewAmount = parseDollarsToCents(amount);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="expense-name" className="mb-2 block font-mono text-xs text-muted">
          name:
        </label>
        <Input
          id="expense-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rent"
          required
        />
      </div>

      <TagInput id="recurring-tags" value={tags} onChange={setTags} />

      <div>
        <label htmlFor="expense-anchor" className="mb-2 block font-mono text-xs text-muted">
          due_anchor:
        </label>
        <Input
          id="expense-anchor"
          name="anchorDate"
          type="date"
          value={anchorDate}
          onChange={(e) => setAnchorDate(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="expense-amount" className="mb-2 block font-mono text-xs text-muted">
            amount:
          </label>
          <Input
            id="expense-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1200.00"
            required
          />
        </div>

        <div>
          <label htmlFor="expense-currency" className="mb-2 block font-mono text-xs text-muted">
            currency:
          </label>
          <select
            id="expense-currency"
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
        <label
          htmlFor="expense-last-payment"
          className="mb-2 block font-mono text-xs text-muted"
        >
          last_payment_date:
        </label>
        <Input
          id="expense-last-payment"
          name="lastPaymentDate"
          type="date"
          value={lastPaymentDate}
          onChange={(e) => setLastPaymentDate(e.target.value)}
        />
        <p className="mt-1 font-mono text-xs text-muted">
          optional — no charges after this date
        </p>
      </div>

      <div>
        <label htmlFor="expense-frequency" className="mb-2 block font-mono text-xs text-muted">
          frequency:
        </label>
        <select
          id="expense-frequency"
          name="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as PayFrequency)}
          className={cn(
            "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent",
          )}
        >
          {payFrequencies.map((value) => (
            <option key={value} value={value}>
              {formatFrequency(value)}
            </option>
          ))}
        </select>
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

      {previewDates.length > 0 && (
        <div className="rounded border border-border/60 bg-bg/50 px-3 py-2">
          <p className="font-mono text-xs text-muted">upcoming due dates:</p>
          <ul className="mt-2 space-y-1">
            {previewDates.map((date) => (
              <li
                key={date}
                className="flex items-center justify-between font-mono text-xs text-text"
              >
                <span>
                  {formatDate(date)} {"//"} {formatFrequency(frequency)}
                </span>
                {previewAmount !== null ? (
                  <ExpenseAmount
                    amount={formatScheduledExpenseAmount(
                      previewAmount,
                      currency,
                    )}
                    className="text-xs text-danger"
                  />
                ) : (
                  <span className="font-mono text-xs text-muted">—</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="font-mono text-xs text-danger">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {pending ? "saving..." : isEditing ? "update" : "add recurring"}
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
