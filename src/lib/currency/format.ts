import type { CurrencyCode } from "./types";
import {
  CURRENCY_LOCALES,
  getMinorDivisor,
  toIsoCurrency,
} from "./types";
import { convertAmount, type ExchangeRates } from "./convert";

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

  const divisor = getMinorDivisor(target);
  return new Intl.NumberFormat(CURRENCY_LOCALES[target], {
    style: "currency",
    currency: toIsoCurrency(target),
    minimumFractionDigits: target === "cop" ? 0 : 2,
    maximumFractionDigits: target === "cop" ? 0 : 2,
  }).format(converted / divisor);
}

export function formatMoneySigned(
  amountMinor: number,
  currency: CurrencyCode,
  displayCurrency?: CurrencyCode,
  rates?: ExchangeRates,
  sign: "+" | "-" = "+",
): string {
  const formatted = formatMoney(
    amountMinor,
    currency,
    displayCurrency,
    rates,
  );
  return `${sign}${formatted}`;
}
