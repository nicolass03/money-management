import { getMinorDivisor, type CurrencyCode } from "./types";

/** Parse a decimal form input into the currency's minor units (cents for USD/EUR, pesos for COP). */
export function parseToMinorUnits(
  value: string,
  currency: CurrencyCode,
): number | null {
  const trimmed = value.trim().replace(/[$,]/g, "");
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * getMinorDivisor(currency));
}

/** Decimal form input for a minor-unit amount — parity with iOS `formatMinorUnitsAsInput`. */
export function formatMinorUnitsAsInput(
  amountMinor: number,
  currency: CurrencyCode,
): string {
  const major = amountMinor / getMinorDivisor(currency);
  return currency === "cop" ? String(Math.round(major)) : major.toFixed(2);
}
