import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountSelect } from "@/components/accounts/account-select";
import { useEntryAccount } from "@/components/accounts/use-entry-account";
import { useAccounts } from "@/hooks/use-queries";
import { useCreateExpense, useUpdateExpense } from "@/lib/mutations/expenses";
import { formatMinorUnitsAsInput } from "@/lib/currency/input";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { formatTagNames } from "@/lib/expenses/tag-utils";
import type { ProjectionExpenseItem } from "@/lib/types/domain";
import { TagInput } from "./tag-input";

interface ExpenseFormProps {
  defaultDate: string;
  /** A recorded manual expense to edit; omitted = add a new one. */
  expense?: ProjectionExpenseItem & { id: string };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function ExpenseForm({
  defaultDate,
  expense,
  onCancel,
  onSuccess,
}: ExpenseFormProps) {
  const { t } = useTranslation(["expenses", "common"]);
  // Unique field ids: an edit form can be open next to the add form.
  const fieldId = useId();
  const { data: accounts = [] } = useAccounts();
  const [name, setName] = useState(expense?.name ?? "");
  const [tags, setTags] = useState(expense ? formatTagNames(expense.tags) : "");
  const [amount, setAmount] = useState(
    expense ? formatMinorUnitsAsInput(expense.amount, expense.currency) : "",
  );
  const [date, setDate] = useState(expense?.date ?? defaultDate);
  const [isSubscription, setIsSubscription] = useState(expense?.isSubscription ?? false);
  const [error, setError] = useState("");

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const pending = createExpense.isPending || updateExpense.isPending;
  // Currency follows the chosen account; editing keeps an existing row's account/currency.
  const { setAccountId, currentAccountId, submitAccountId, currency } = useEntryAccount(
    accounts,
    expense && { accountId: expense.accountId ?? null, currency: expense.currency },
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = {
      name,
      tags,
      amount,
      currency,
      date,
      isSubscription,
      accountId: submitAccountId,
    };
    const result = expense
      ? await updateExpense.mutateAsync({ id: expense.id, input })
      : await createExpense.mutateAsync(input);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (!expense) {
      setName("");
      setTags("");
      setAmount("");
      setAccountId("");
      setDate(defaultDate);
      setIsSubscription(false);
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor={`${fieldId}-name`} className="mb-2 block font-mono text-xs text-muted">
          {t("common:labelName")}
        </label>
        <Input
          id={`${fieldId}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("expenses:namePlaceholder")}
          required
        />
      </div>

      <TagInput id={`${fieldId}-tags`} value={tags} onChange={setTags} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${fieldId}-amount`} className="mb-2 block font-mono text-xs text-muted">
            {t("common:labelAmount")}
          </label>
          <Input
            id={`${fieldId}-amount`}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("expenses:amountPlaceholder")}
            required
          />
        </div>

        <div>
          <label htmlFor={`${fieldId}-currency`} className="mb-2 block font-mono text-xs text-muted">
            {t("common:labelCurrency")}
          </label>
          <div
            id={`${fieldId}-currency`}
            className="w-full border border-border bg-bg/50 px-3 py-2 font-mono text-sm text-muted"
          >
            {formatCurrencyLabel(currency)}
          </div>
        </div>
      </div>

      <AccountSelect
        id={`${fieldId}-account`}
        accounts={accounts}
        value={currentAccountId}
        onChange={setAccountId}
      />

      <div>
        <label htmlFor={`${fieldId}-date`} className="mb-2 block font-mono text-xs text-muted">
          {t("common:labelDate")}
        </label>
        <Input
          id={`${fieldId}-date`}
          type="date"
          value={date}
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
        {t("expenses:subscription")}
      </label>

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {pending
            ? t("common:saving")
            : expense
              ? t("common:save")
              : t("expenses:submitAdd")}
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
