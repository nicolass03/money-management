import type { CurrencyCode } from "./types";
import {
  CURRENCY_LOCALES,
  getMinorDivisor,
  toIsoCurrency,
} from "./types";
import { convertAmount, type ExchangeRates } from "./convert";

// Intl formatters are costly to construct and this runs for every rendered amount.
const moneyFormatters = new Map<CurrencyCode, Intl.NumberFormat>();

function moneyFormatter(currency: CurrencyCode): Intl.NumberFormat {
  let formatter = moneyFormatters.get(currency);
  if (!formatter) {
    const fractionDigits = currency === "cop" ? 0 : 2;
    formatter = new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
      style: "currency",
      currency: toIsoCurrency(currency),
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    moneyFormatters.set(currency, formatter);
  }
  return formatter;
}

export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode,
  displayCurrency?: CurrencyCode,
  rates?: ExchangeRates,
): string {
  const target = displayCurrency ?? currency;
  const converted =
    rates && currency !== target
      ? convertAmount(amountMinor, currency, target, rates)
      : amountMinor;

  return moneyFormatter(target).format(converted / getMinorDivisor(target));
}

/** Format in the expense's own currency without conversion. */
export function formatNativeMoney(
  amountMinor: number,
  currency: CurrencyCode,
): string {
  return formatMoney(amountMinor, currency);
}
