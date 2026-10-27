import { getMinorDivisor, type CurrencyCode } from "./types";

// Digits with optional comma thousands-grouping, then up to two decimals — parity with iOS
// `MoneyFormatter.normalizeAmountInput`. A comma decimal ("12,50") is rejected instead of being
// read as 1250.
const AMOUNT_PATTERN = /^(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d{0,2})?$/;

/** Parse a decimal form input into the currency's minor units (cents for USD/EUR, pesos for COP). */
export function parseToMinorUnits(
  value: string,
  currency: CurrencyCode,
): number | null {
  const normalized = value.replace(/[$€\s]/g, "");
  if (!/\d/.test(normalized) || !AMOUNT_PATTERN.test(normalized)) {
    return null;
  }

  return Math.round(Number(normalized.replace(/,/g, "")) * getMinorDivisor(currency));
}

/** Decimal form input for a minor-unit amount — parity with iOS `formatMinorUnitsAsInput`. */
export function formatMinorUnitsAsInput(
  amountMinor: number,
  currency: CurrencyCode,
): string {
  const major = amountMinor / getMinorDivisor(currency);
  return currency === "cop" ? String(Math.round(major)) : major.toFixed(2);
}
