import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateAccount, useUpdateAccount } from "@/lib/mutations/accounts";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import type { Account } from "@/lib/types/domain";
import { cn, formatCentsAsDollarsInput } from "@/lib/utils";

interface AccountFormProps {
  account?: Account;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function AccountForm({ account, onCancel, onSuccess }: AccountFormProps) {
  const { t } = useTranslation(["accounts", "common"]);
  const isEditing = Boolean(account);
  const [name, setName] = useState(account?.name ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>(
    account?.currency ?? "usd",
  );
  const [initialAmount, setInitialAmount] = useState(
    account ? formatCentsAsDollarsInput(account.initialAmount) : "",
  );
  const [error, setError] = useState("");

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const pending = createAccount.isPending || updateAccount.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = { name, currency, initialAmount };
    const result = isEditing
      ? await updateAccount.mutateAsync({ id: account!.id, input })
      : await createAccount.mutateAsync(input);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (!isEditing) {
      setName("");
      setCurrency("usd");
      setInitialAmount("");
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="account-name" className="mb-2 block font-mono text-xs text-muted">
          {t("accounts:labelName")}
        </label>
        <Input
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("accounts:namePlaceholder")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="account-amount"
            className="mb-2 block font-mono text-xs text-muted"
          >
            {t("accounts:labelInitialAmount")}
          </label>
          <Input
            id="account-amount"
            type="text"
            inputMode="decimal"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            placeholder={t("accounts:initialAmountPlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="account-currency"
            className="mb-2 block font-mono text-xs text-muted"
          >
            {t("common:labelCurrency")}
          </label>
          <select
            id="account-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            disabled={isEditing}
            className={cn(
              "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent focus:shadow-[0_0_8px_var(--glow-color)]",
              isEditing && "cursor-not-allowed opacity-60",
            )}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {formatCurrencyLabel(c)}
              </option>
            ))}
          </select>
          {isEditing && (
            <p className="mt-1 font-mono text-[10px] text-muted">
              {t("accounts:currencyFixedHint")}
            </p>
          )}
        </div>
      </div>

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {pending
            ? t("common:saving")
            : isEditing
              ? t("common:update")
              : t("accounts:submitAdd")}
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
