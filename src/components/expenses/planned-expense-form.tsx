import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreatePlannedExpense,
  useUpdatePlannedExpense,
} from "@/lib/mutations/planned-expenses";
import { formatScheduledExpenseAmount } from "@/lib/currency/expense-display";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { ExpenseAmount } from "./expense-amount";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import type { PlannedExpenseWithTags } from "@/lib/types/domain";
import { formatTagNames } from "@/lib/expenses/tag-utils";
import {
  cn,
  formatCentsAsDollarsInput,
  formatDate,
  parseDollarsToCents,
} from "@/lib/utils";
import { TagInput } from "./tag-input";


interface PlannedExpenseFormProps extends MoneyDisplayContext {
  planned?: PlannedExpenseWithTags;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function PlannedExpenseForm({
  planned,
  onCancel,
  onSuccess,
  displayCurrency,
  rates,
}: PlannedExpenseFormProps) {
  const { t } = useTranslation(["expenses", "common"]);
  const isEditing = Boolean(planned);
  const [name, setName] = useState(planned?.name ?? "");
  const [tags, setTags] = useState(
    planned ? formatTagNames(planned.tags) : "",
  );
  const [date, setDate] = useState(planned?.date ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>(
    planned?.currency ?? "usd",
  );
  const [amount, setAmount] = useState(
    planned ? formatCentsAsDollarsInput(planned.amount) : "",
  );

  const [error, setError] = useState("");

  const createPlanned = useCreatePlannedExpense();
  const updatePlanned = useUpdatePlannedExpense();
  const pending = createPlanned.isPending || updatePlanned.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = { name, tags, date, amount, currency };
    const result = isEditing
      ? await updatePlanned.mutateAsync({ id: planned!.id, input })
      : await createPlanned.mutateAsync(input);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
  }

  const previewAmount = parseDollarsToCents(amount);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="planned-name" className="mb-2 block font-mono text-xs text-muted">
          {t("common:labelName")}
        </label>
        <Input
          id="planned-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("expenses:plannedNamePlaceholder")}
          required
        />
      </div>

      <TagInput id="planned-tags" value={tags} onChange={setTags} />

      <div>
        <label htmlFor="planned-date" className="mb-2 block font-mono text-xs text-muted">
          {t("common:labelDate")}
        </label>
        <Input
          id="planned-date"
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        {!isEditing && (
          <p className="mt-1 font-mono text-xs text-muted">
            {t("expenses:futureDateHint")}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="planned-amount" className="mb-2 block font-mono text-xs text-muted">
            {t("common:labelAmount")}
          </label>
          <Input
            id="planned-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("expenses:plannedAmountPlaceholder")}
            required
          />
        </div>

        <div>
          <label htmlFor="planned-currency" className="mb-2 block font-mono text-xs text-muted">
            {t("common:labelCurrency")}
          </label>
          <select
            id="planned-currency"
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

      {date && previewAmount !== null && (
        <div className="rounded border border-border/60 bg-bg/50 px-3 py-2">
          <p className="font-mono text-xs text-muted">
            {t("expenses:plannedChargePreview")}
          </p>
          <div className="mt-2 flex items-center justify-between font-mono text-xs text-text">
            <span>{formatDate(date)}</span>
            <ExpenseAmount
              amount={formatScheduledExpenseAmount(previewAmount, currency)}
              className="text-xs text-danger"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="font-mono text-xs text-danger">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {pending
            ? t("common:saving")
            : isEditing
              ? t("common:update")
              : t("expenses:submitAddPlanned")}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("common:cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
