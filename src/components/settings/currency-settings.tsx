import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import {
  useRefreshExchangeRates,
  useUpdateDisplayCurrency,
} from "@/lib/mutations/settings";
import type { ExchangeRates } from "@/lib/currency/convert";
import { MoneyText, usePrivacyMode } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { maskNumericValue } from "@/lib/privacy/mask";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { cn } from "@/lib/utils";

interface CurrencySettingsProps {
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
}

export function CurrencySettings({
  displayCurrency,
  rates,
}: CurrencySettingsProps) {
  const { t } = useTranslation(["settings", "common"]);
  const { privacyMode } = usePrivacyMode();
  const updateCurrency = useUpdateDisplayCurrency();
  const refreshRates = useRefreshExchangeRates();
  const [currencySuccess, setCurrencySuccess] = useState(false);

  async function handleCurrencySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCurrencySuccess(false);
    const formData = new FormData(e.currentTarget);
    const result = await updateCurrency.mutateAsync(
      String(formData.get("displayCurrency") ?? ""),
    );
    if (result.success) setCurrencySuccess(true);
  }

  const sampleAmounts: { currency: CurrencyCode; amount: number }[] = [
    { currency: "usd", amount: 10000 },
    { currency: "eur", amount: 10000 },
    { currency: "cop", amount: 50000 },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("settings:currencyTitle")}
        subtitle={t("settings:currencySubtitle")}
      />

      <Card>
        <form onSubmit={handleCurrencySubmit} className="space-y-4">
          <div>
            <label
              htmlFor="display-currency"
              className="mb-2 block font-mono text-xs text-muted"
            >
              {t("settings:displayCurrency")}
            </label>
            <select
              id="display-currency"
              name="displayCurrency"
              defaultValue={displayCurrency}
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

          {updateCurrency.data?.error && (
            <p className="font-mono text-xs text-danger">
              {updateCurrency.data.error}
            </p>
          )}
          {currencySuccess && (
            <p className="font-mono text-xs text-success">
              {t("settings:currencyUpdated")}
            </p>
          )}

          <Button type="submit" loading={updateCurrency.isPending}>
            {updateCurrency.isPending ? t("common:saving") : t("settings:saveCurrency")}
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted">{t("settings:exchangeRates")}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              loading={refreshRates.isPending}
              onClick={() => refreshRates.mutate()}
            >
              {refreshRates.isPending ? t("settings:refreshingRates") : t("settings:refreshRates")}
            </Button>
          </div>
          <p className="mt-1 font-mono text-xs text-muted">
            {t("settings:lastUpdated", { value: new Date(rates.fetchedAt).toLocaleString() })}
          </p>
          <ul className="mt-3 space-y-1">
            {(["EUR", "USD", "COP"] as const).map((code) => (
              <li
                key={code}
                className="flex justify-between font-mono text-xs text-text"
              >
                <span>1 USD =</span>
                <span>
                  {code === "USD"
                    ? privacyMode
                      ? "•.•• USD"
                      : "1.00 USD"
                    : privacyMode
                      ? `${maskNumericValue(
                          rates.rates[code]?.toLocaleString() ?? "—",
                        )} ${code}`
                      : `${rates.rates[code]?.toLocaleString() ?? "—"} ${code}`}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 font-mono text-xs text-muted">{t("settings:previewConversions")}</p>
          <ul className="mt-2 space-y-1">
            {sampleAmounts.map(({ currency, amount }) => (
              <li
                key={currency}
                className="flex justify-between font-mono text-xs text-text"
              >
                <MoneyText value={formatMoney(amount, currency)} />
                <span className="text-accent">
                  →{" "}
                  <MoneyText
                    value={formatMoney(
                      amount,
                      currency,
                      displayCurrency,
                      rates,
                    )}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
