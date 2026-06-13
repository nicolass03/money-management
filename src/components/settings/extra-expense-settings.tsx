import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { useUpdateExtraExpenseSettings } from "@/lib/mutations/settings";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { cn, formatCentsAsDollarsInput } from "@/lib/utils";

interface ExtraExpenseSettingsProps {
  extraExpenseLimit: number | null | undefined;
  extraExpenseLimitCurrency: CurrencyCode | null | undefined;
  displayCurrency: CurrencyCode;
}

function formatAmountInput(amountMinor: number, currency: CurrencyCode): string {
  if (currency === "cop") return String(amountMinor);
  return formatCentsAsDollarsInput(amountMinor);
}

export function ExtraExpenseSettings({
  extraExpenseLimit,
  extraExpenseLimitCurrency,
  displayCurrency,
}: ExtraExpenseSettingsProps) {
  const updateSettings = useUpdateExtraExpenseSettings();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const defaultCurrency = extraExpenseLimitCurrency ?? displayCurrency;
  const defaultAmount =
    extraExpenseLimit != null
      ? formatAmountInput(extraExpenseLimit, defaultCurrency)
      : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(false);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await updateSettings.mutateAsync({
      amount: String(formData.get("extraExpenseLimit") ?? ""),
      currency: String(formData.get("extraExpenseLimitCurrency") ?? ""),
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.success) setSuccess(true);
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="extra expenses"
        subtitle="set a per pay-period limit for unplanned treats and one-off spend"
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="extra-expense-currency"
                className="mb-2 block font-mono text-xs text-muted"
              >
                currency:
              </label>
              <select
                id="extra-expense-currency"
                name="extraExpenseLimitCurrency"
                defaultValue={defaultCurrency}
                className={cn(
                  "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent",
                )}
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {formatCurrencyLabel(currency)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="extra-expense-limit"
                className="mb-2 block font-mono text-xs text-muted"
              >
                limit_per_period:
              </label>
              <Input
                id="extra-expense-limit"
                name="extraExpenseLimit"
                type="text"
                inputMode="decimal"
                placeholder={
                  defaultCurrency === "cop" ? "150000" : "500.00"
                }
                defaultValue={defaultAmount}
              />
              <p className="mt-1 font-mono text-xs text-muted">
                {"> leave blank to clear the limit"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "saving..." : "save limit"}
            </Button>
            {success && (
              <span className="font-mono text-xs text-accent">saved</span>
            )}
            {error && (
              <span className="font-mono text-xs text-danger">{error}</span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
