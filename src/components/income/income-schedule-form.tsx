import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCreateSchedule, useUpdateSchedule } from "@/lib/mutations/income-schedules";
import { AccountSelect } from "@/components/accounts/account-select";
import { useAccounts } from "@/hooks/use-queries";
import { MoneyText } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { formatCurrencyLabel } from "@/lib/currency/types";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import {
  payFrequencies,
  type PayFrequency,
} from "@/lib/types/constants";
import type { IncomePaySchedule } from "@/lib/types/domain";
import { formatFrequency, getUpcomingPayDates } from "@/lib/income/pay-periods";
import {
  formatCentsAsDollarsInput,
  formatDate,
  parseDollarsToCents,
} from "@/lib/utils";

interface IncomeScheduleFormProps extends MoneyDisplayContext {
  schedule?: IncomePaySchedule;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function IncomeScheduleForm({
  schedule,
  onCancel,
  onSuccess,
  displayCurrency,
  rates,
}: IncomeScheduleFormProps) {
  const { t } = useTranslation(["income", "common"]);
  const { data: accounts = [] } = useAccounts();
  const isEditing = Boolean(schedule);
  const [name, setName] = useState(schedule?.name ?? "");
  const [anchorDate, setAnchorDate] = useState(schedule?.anchorDate ?? "");
  const [frequency, setFrequency] = useState<PayFrequency>(
    schedule?.frequency ?? "biweekly",
  );
  const [accountId, setAccountId] = useState(schedule?.accountId ?? "");
  const [amount, setAmount] = useState(
    schedule ? formatCentsAsDollarsInput(schedule.amount) : "",
  );
  const [error, setError] = useState("");

  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const pending = createSchedule.isPending || updateSchedule.isPending;
  // Scheduled income lands in the chosen account; currency follows it.
  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const currency = selectedAccount?.currency ?? schedule?.currency ?? "usd";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = {
      name,
      anchorDate,
      frequency,
      amount,
      currency,
      accountId: selectedAccount?.id ?? null,
    };
    const result = isEditing
      ? await updateSchedule.mutateAsync({ id: schedule!.id, input })
      : await createSchedule.mutateAsync(input);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
  }

  const previewDates =
    anchorDate && payFrequencies.includes(frequency)
      ? getUpcomingPayDates({ anchorDate, frequency }, 4)
      : [];
  const previewAmount = parseDollarsToCents(amount);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="schedule-name"
          className="mb-2 block font-mono text-xs text-muted"
        >
          {t("common:labelName")}
        </label>
        <Input
          id="schedule-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("income:namePlaceholder")}
          required
        />
      </div>

      <div>
        <label
          htmlFor="schedule-anchor"
          className="mb-2 block font-mono text-xs text-muted"
        >
          {t("income:labelPayAnchor")}
        </label>
        <Input
          id="schedule-anchor"
          type="date"
          value={anchorDate}
          onChange={(e) => setAnchorDate(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="schedule-amount"
            className="mb-2 block font-mono text-xs text-muted"
          >
            {t("income:labelAmountPerPay")}
          </label>
          <Input
            id="schedule-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("income:amountPlaceholder")}
            required
          />
        </div>

        <div>
          <label
            htmlFor="schedule-currency"
            className="mb-2 block font-mono text-xs text-muted"
          >
            {t("common:labelCurrency")}
          </label>
          <div
            id="schedule-currency"
            className="w-full border border-border bg-bg/50 px-3 py-2 font-mono text-sm text-muted"
          >
            {formatCurrencyLabel(currency)}
          </div>
        </div>
      </div>

      <AccountSelect
        id="schedule-account"
        accounts={accounts}
        value={selectedAccount?.id ?? ""}
        onChange={setAccountId}
      />

      <div>
        <label
          htmlFor="schedule-frequency"
          className="mb-2 block font-mono text-xs text-muted"
        >
          {t("income:labelFrequency")}
        </label>
        <select
          id="schedule-frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as PayFrequency)}
          className={cn(
            "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent focus:shadow-[0_0_8px_var(--glow-color)]",
          )}
        >
          <option value="biweekly">{t("common:frequencyBiweekly")}</option>
          <option value="monthly">{t("common:frequencyMonthly")}</option>
        </select>
      </div>

      {previewDates.length > 0 && (
        <div className="rounded border border-border/60 bg-bg/50 px-3 py-2">
          <p className="font-mono text-xs text-muted">{t("income:upcomingPayDates")}</p>
          <ul className="mt-2 space-y-1">
            {previewDates.map((date) => (
              <li
                key={date}
                className="flex items-center justify-between font-mono text-xs text-text"
              >
                <span>
                  {formatDate(date)} {"//"} {formatFrequency(frequency)}
                </span>
                <span className="text-success">
                  {previewAmount !== null ? (
                    <MoneyText
                      value={formatMoney(
                        previewAmount,
                        currency,
                        displayCurrency,
                        rates,
                      )}
                    />
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
              : t("income:submitAddSchedule")}
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
