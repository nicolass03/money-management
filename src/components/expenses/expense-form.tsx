import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountSelect } from "@/components/accounts/account-select";
import { useAccounts } from "@/hooks/use-queries";
import { useCreateExpense } from "@/lib/mutations/expenses";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { TagInput } from "./tag-input";

interface ExpenseFormProps {
  defaultDate: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function ExpenseForm({
  defaultDate,
  onCancel,
  onSuccess,
}: ExpenseFormProps) {
  const { t } = useTranslation(["expenses", "common"]);
  const { data: accounts = [] } = useAccounts();
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [isSubscription, setIsSubscription] = useState(false);
  const [error, setError] = useState("");

  const createExpense = useCreateExpense();
  // Currency follows the chosen account; fall back to the first account when none is selected yet.
  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const currency = selectedAccount?.currency ?? "usd";

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
      accountId: selectedAccount?.id ?? null,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
    setTags("");
    setAmount("");
    setAccountId("");
    setDate(defaultDate);
    setIsSubscription(false);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="oneoff-name" className="mb-2 block font-mono text-xs text-muted">
          {t("common:labelName")}
        </label>
        <Input
          id="oneoff-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("expenses:namePlaceholder")}
          required
        />
      </div>

      <TagInput id="oneoff-tags" value={tags} onChange={setTags} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="oneoff-amount" className="mb-2 block font-mono text-xs text-muted">
            {t("common:labelAmount")}
          </label>
          <Input
            id="oneoff-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("expenses:amountPlaceholder")}
            required
          />
        </div>

        <div>
          <label htmlFor="oneoff-currency" className="mb-2 block font-mono text-xs text-muted">
            {t("common:labelCurrency")}
          </label>
          <div
            id="oneoff-currency"
            className="w-full border border-border bg-bg/50 px-3 py-2 font-mono text-sm text-muted"
          >
            {formatCurrencyLabel(currency)}
          </div>
        </div>
      </div>

      <AccountSelect
        id="oneoff-account"
        accounts={accounts}
        value={selectedAccount?.id ?? ""}
        onChange={setAccountId}
      />

      <div>
        <label htmlFor="oneoff-date" className="mb-2 block font-mono text-xs text-muted">
          {t("common:labelDate")}
        </label>
        <Input
          id="oneoff-date"
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
        <Button type="submit" loading={createExpense.isPending}>
          {createExpense.isPending ? t("common:saving") : t("expenses:submitAdd")}
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
