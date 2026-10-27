import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyText } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { formatMinorUnitsAsInput, parseToMinorUnits } from "@/lib/currency/input";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { localTodayIso } from "@/lib/date/local-today";
import { formatFrequency, getUpcomingOccurrences } from "@/lib/income/pay-periods";
import { useSaveRecurringTransfer, useSaveTransfer } from "@/lib/mutations/transfers";
import { payFrequencies, type PayFrequency } from "@/lib/types/constants";
import type { Account, RecurringTransfer, Transfer } from "@/lib/types/domain";
import { formatDate } from "@/lib/utils";
import { AccountSelect } from "./account-select";
import { useEntryAccount } from "./use-entry-account";

interface TransferFormProps {
  accounts: Account[];
  /** Edit a transfer (one-off, or an occurrence created by a recurring transfer). */
  transfer?: Transfer;
  /** Edit a recurring transfer. */
  recurring?: RecurringTransfer;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const selectClass =
  "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent focus:shadow-[0_0_8px_var(--glow-color)]";

export function TransferForm({
  accounts,
  transfer,
  recurring,
  onCancel,
  onSuccess,
}: TransferFormProps) {
  const { t } = useTranslation(["accounts", "common"]);
  const existing = transfer ?? recurring;
  const isEditing = Boolean(existing);
  // An occurrence's date and accounts follow its schedule (the API rejects changing them).
  const locked = Boolean(transfer?.recurringTransferId);
  const [repeat, setRepeat] = useState(Boolean(recurring));
  const isRecurring = !transfer && repeat;
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(
    existing ? formatMinorUnitsAsInput(existing.amount, existing.currency) : "",
  );
  const [date, setDate] = useState(
    transfer?.date ?? recurring?.anchorDate ?? localTodayIso(),
  );
  const [frequency, setFrequency] = useState<PayFrequency>(
    recurring?.frequency ?? "monthly",
  );
  const [toChoice, setToChoice] = useState(existing?.toAccountId ?? "");
  const [error, setError] = useState("");

  const saveTransfer = useSaveTransfer();
  const saveRecurring = useSaveRecurringTransfer();
  const pending = saveTransfer.isPending || saveRecurring.isPending;

  // The source account sets the currency; editing keeps an archived source instead of rebinding.
  const from = useEntryAccount(
    accounts,
    existing && { accountId: existing.fromAccountId, currency: existing.currency },
  );
  const { currency } = from;
  // v1 transfers are same-currency: offer only the source currency's other accounts, keeping the
  // row's own destination when editing (even if it has since been archived).
  const toOptions = accounts.filter(
    (a) => a.currency === currency && a.id !== from.currentAccountId,
  );
  const keepsExistingTo =
    existing?.toAccountId === toChoice &&
    existing.currency === currency &&
    toChoice !== from.currentAccountId;
  const toAccountId =
    keepsExistingTo || toOptions.some((a) => a.id === toChoice)
      ? toChoice
      : (toOptions[0]?.id ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = {
      name,
      fromAccountId: from.currentAccountId,
      toAccountId,
      amount,
      currency,
      date,
    };
    const result = isRecurring
      ? await saveRecurring.mutateAsync({ id: recurring?.id, input: { ...input, frequency } })
      : await saveTransfer.mutateAsync({ id: transfer?.id, input });
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
  }

  const previewDates =
    isRecurring && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? getUpcomingOccurrences({ anchorDate: date, frequency }, 3)
      : [];
  const previewAmount = parseToMinorUnits(amount, currency);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="transfer-name" className="mb-2 block font-mono text-xs text-muted">
          {t("accounts:labelName")}
        </label>
        <Input
          id="transfer-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("accounts:transferNamePlaceholder")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AccountSelect
          id="transfer-from"
          label={t("accounts:labelFromAccount")}
          accounts={accounts}
          value={from.currentAccountId}
          onChange={from.setAccountId}
          disabled={locked}
        />
        <div>
          <AccountSelect
            id="transfer-to"
            label={t("accounts:labelToAccount")}
            accounts={toOptions}
            value={toAccountId}
            onChange={setToChoice}
            disabled={locked}
          />
          {!toAccountId && (
            <p className="mt-1 font-mono text-[10px] text-warning">
              {t("accounts:noTransferTarget")}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="transfer-amount" className="mb-2 block font-mono text-xs text-muted">
            {t("common:labelAmount")}
          </label>
          <Input
            id="transfer-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label htmlFor="transfer-currency" className="mb-2 block font-mono text-xs text-muted">
            {t("common:labelCurrency")}
          </label>
          <div
            id="transfer-currency"
            className="w-full border border-border bg-bg/50 px-3 py-2 font-mono text-sm text-muted"
          >
            {formatCurrencyLabel(currency)}
          </div>
        </div>
      </div>

      {!isEditing && (
        <label className="flex items-center gap-2 font-mono text-sm text-text">
          <input
            type="checkbox"
            checked={repeat}
            onChange={(e) => setRepeat(e.target.checked)}
            className="accent-accent"
          />
          {t("accounts:repeatTransfer")}
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="transfer-date" className="mb-2 block font-mono text-xs text-muted">
            {isRecurring ? t("accounts:labelFirstTransfer") : t("common:labelDate")}
          </label>
          <Input
            id="transfer-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={locked}
            required
          />
        </div>
        {isRecurring && (
          <div>
            <label
              htmlFor="transfer-frequency"
              className="mb-2 block font-mono text-xs text-muted"
            >
              {t("accounts:labelFrequency")}
            </label>
            <select
              id="transfer-frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as PayFrequency)}
              className={selectClass}
            >
              {payFrequencies.map((value) => (
                <option key={value} value={value}>
                  {formatFrequency(value)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {locked && (
        <p className="font-mono text-[10px] text-muted">{t("accounts:occurrenceLockedHint")}</p>
      )}

      {previewDates.length > 0 && (
        <div className="rounded border border-border/60 bg-bg/50 px-3 py-2">
          <p className="font-mono text-xs text-muted">{t("accounts:upcomingTransfers")}</p>
          <ul className="mt-2 space-y-1">
            {previewDates.map((day) => (
              <li
                key={day}
                className="flex items-center justify-between font-mono text-xs text-text"
              >
                <span>
                  {formatDate(day)} {"//"} {formatFrequency(frequency)}
                </span>
                <span className="text-accent-glow">
                  {previewAmount !== null ? (
                    <MoneyText value={formatMoney(previewAmount, currency)} />
                  ) : (
                    "—"
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          {pending
            ? t("common:saving")
            : isEditing
              ? t("common:update")
              : isRecurring
                ? t("accounts:submitRecurringTransfer")
                : t("accounts:submitTransfer")}
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
