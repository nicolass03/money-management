import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateBudget, useUpdateBudget } from "@/lib/mutations/budgets";
import { formatCurrencyLabel } from "@/lib/currency/types";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import type { BudgetWithTags } from "@/lib/types/domain";
import { formatTagNames } from "@/lib/expenses/tag-utils";
import { cn, formatCentsAsDollarsInput } from "@/lib/utils";
import { TagInput } from "@/components/expenses/tag-input";

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
  const { t } = useTranslation(["budgets", "common"]);
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
  const [error, setError] = useState("");

  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const pending = createBudget.isPending || updateBudget.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = {
      name,
      amount,
      currency,
      startDate: dated ? startDate : "",
      endDate: dated ? endDate : "",
      tags,
    };
    const result = isEditing
      ? await updateBudget.mutateAsync({ id: budget!.id, input })
      : await createBudget.mutateAsync(input);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
  }

  function handleDatedToggle(checked: boolean) {
    setDated(checked);
    if (!checked) {
      setStartDate("");
      setEndDate("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="budget-name" className="mb-2 block font-mono text-xs text-muted">
          {t("common:labelName")}
        </label>
        <Input
          id="budget-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("budgets:namePlaceholder")}
          required
        />
      </div>

      <TagInput id="budget-tags" value={tags} onChange={setTags} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="budget-amount" className="mb-2 block font-mono text-xs text-muted">
            {t("common:labelAmount")}
          </label>
          <Input
            id="budget-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("budgets:amountPlaceholder")}
            required
          />
        </div>

        <div>
          <label htmlFor="budget-currency" className="mb-2 block font-mono text-xs text-muted">
            {t("common:labelCurrency")}
          </label>
          <select
            id="budget-currency"
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
          {t("budgets:datedBudgetCheckbox")}
        </label>
        {dated && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="budget-start" className="mb-2 block font-mono text-xs text-muted">
                {t("budgets:labelStartDate")}
              </label>
              <Input
                id="budget-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required={dated}
              />
            </div>
            <div>
              <label htmlFor="budget-end" className="mb-2 block font-mono text-xs text-muted">
                {t("budgets:labelEndDate")}
              </label>
              <Input
                id="budget-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required={dated}
              />
            </div>
          </div>
        )}
        <p className="mt-2 font-mono text-xs text-muted">
          {dated ? t("budgets:datedBudgetHint") : t("budgets:openEndedBudgetHint")}
        </p>
      </div>

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {pending
            ? t("common:saving")
            : isEditing
              ? t("common:update")
              : t("budgets:submitAdd")}
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
