import type { CurrencyCode } from "./types";
import type { ExchangeRates } from "./convert";
import { convertAmount } from "./convert";

export interface MoneyDisplayContext {
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
}

export function toDisplayAmount(
  amountMinor: number,
  currency: CurrencyCode,
  ctx: MoneyDisplayContext,
): number {
  return convertAmount(
    amountMinor,
    currency,
    ctx.displayCurrency,
    ctx.rates,
  );
}
