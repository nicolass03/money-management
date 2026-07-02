import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountSelect } from "@/components/accounts/account-select";
import { useEntryAccount } from "@/components/accounts/use-entry-account";
import { useAccounts } from "@/hooks/use-queries";
import { useCreateIncome, useUpdateIncome } from "@/lib/mutations/income";
import { formatCurrencyLabel } from "@/lib/currency/types";
import type { Income } from "@/lib/types/domain";
import { localTodayIso } from "@/lib/date/local-today";
import { formatCentsAsDollarsInput } from "@/lib/utils";

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
  const { t } = useTranslation(["income", "common"]);
  const { data: accounts = [] } = useAccounts();
  const isEditing = Boolean(entry);
  const [name, setName] = useState(entry?.name ?? "");
  const [amount, setAmount] = useState(
    entry ? formatCentsAsDollarsInput(entry.amount) : "",
  );
  const [date, setDate] = useState(
    entry?.date ?? defaultDate ?? localTodayIso(),
  );
  const [error, setError] = useState("");

  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const pending = createIncome.isPending || updateIncome.isPending;
  // Income lands in the chosen account; currency follows it. Editing never silently reassigns the
  // account/currency of an existing row (see useEntryAccount).
  const { setAccountId, currentAccountId, submitAccountId, currency } =
    useEntryAccount(accounts, entry);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = {
      name,
      amount,
      currency,
      date,
      accountId: submitAccountId,
    };
    const result = isEditing
      ? await updateIncome.mutateAsync({ id: entry!.id, input })
      : await createIncome.mutateAsync(input);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (!isEditing) {
      setName("");
      setAmount("");
      setAccountId("");
      setDate(defaultDate ?? localTodayIso());
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="income-name"
          className="mb-2 block font-mono text-xs text-muted"
        >
          {t("common:labelName")}
        </label>
        <Input
          id="income-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("income:incomeNamePlaceholder")}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="income-amount"
            className="mb-2 block font-mono text-xs text-muted"
          >
            {t("common:labelAmount")}
          </label>
          <Input
            id="income-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("income:incomeAmountPlaceholder")}
            required
          />
        </div>

        <div>
          <label
            htmlFor="income-currency"
            className="mb-2 block font-mono text-xs text-muted"
          >
            {t("common:labelCurrency")}
          </label>
          <div
            id="income-currency"
            className="w-full border border-border bg-bg/50 px-3 py-2 font-mono text-sm text-muted"
          >
            {formatCurrencyLabel(currency)}
          </div>
        </div>
      </div>

      <AccountSelect
        id="income-account"
        accounts={accounts}
        value={currentAccountId}
        onChange={setAccountId}
      />

      <div>
        <label
          htmlFor="income-date"
          className="mb-2 block font-mono text-xs text-muted"
        >
          {t("common:labelDate")}
        </label>
        <Input
          id="income-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {pending
            ? t("common:saving")
            : isEditing
              ? t("common:update")
              : t("income:submitAddIncome")}
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
