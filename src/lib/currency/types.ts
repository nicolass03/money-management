import type { CurrencyCode } from "@/lib/db/schema";

export type { CurrencyCode };

export const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  usd: "en-US",
  eur: "de-DE",
  cop: "es-CO",
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  usd: "USD",
  eur: "EUR",
  cop: "COP",
};

/** Minor units per major unit (cents for USD/EUR, whole pesos for COP). */
export function getMinorDivisor(currency: CurrencyCode): number {
  return currency === "cop" ? 1 : 100;
}

export function toIsoCurrency(currency: CurrencyCode): string {
  return currency.toUpperCase();
}
