import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreatePlannedExpense,
  useUpdatePlannedExpense,
} from "@/lib/mutations/planned-expenses";
import { AccountSelect } from "@/components/accounts/account-select";
import { useAccounts } from "@/hooks/use-queries";
import { formatScheduledExpenseAmount } from "@/lib/currency/expense-display";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { ExpenseAmount } from "./expense-amount";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { PlannedExpenseWithTags } from "@/lib/types/domain";
import { formatTagNames } from "@/lib/expenses/tag-utils";
import {
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
  const { data: accounts = [] } = useAccounts();
  const isEditing = Boolean(planned);
  const [name, setName] = useState(planned?.name ?? "");
  const [tags, setTags] = useState(
    planned ? formatTagNames(planned.tags) : "",
  );
  const [date, setDate] = useState(planned?.date ?? "");
  const [accountId, setAccountId] = useState(planned?.accountId ?? "");
  const [amount, setAmount] = useState(
    planned ? formatCentsAsDollarsInput(planned.amount) : "",
  );

  const [error, setError] = useState("");

  const createPlanned = useCreatePlannedExpense();
  const updatePlanned = useUpdatePlannedExpense();
  const pending = createPlanned.isPending || updatePlanned.isPending;
  // Currency follows the chosen source account.
  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const currency = selectedAccount?.currency ?? planned?.currency ?? "usd";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = {
      name,
      tags,
      date,
      amount,
      currency,
      accountId: selectedAccount?.id ?? null,
    };
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
          <div
            id="planned-currency"
            className="w-full border border-border bg-bg/50 px-3 py-2 font-mono text-sm text-muted"
          >
            {formatCurrencyLabel(currency)}
          </div>
        </div>
      </div>

      <AccountSelect
        id="planned-account"
        accounts={accounts}
        value={selectedAccount?.id ?? ""}
        onChange={setAccountId}
      />

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
