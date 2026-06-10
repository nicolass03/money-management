import type { CurrencyCode } from "./types";
import { getMinorDivisor } from "./types";

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string;
}

export function convertAmount(
  amountMinor: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates,
): number {
  if (from === to) {
    return amountMinor;
  }

  const fromRate = rates.rates[toIsoKey(from)];
  const toRate = rates.rates[toIsoKey(to)];

  if (!fromRate || !toRate) {
    return amountMinor;
  }

  const majorInUsd =
    amountMinor / getMinorDivisor(from) / fromRate;
  const majorInTarget = majorInUsd * toRate;
  return Math.round(majorInTarget * getMinorDivisor(to));
}

function toIsoKey(currency: CurrencyCode): string {
  return currency.toUpperCase();
}
