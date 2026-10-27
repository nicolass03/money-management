import { convertAmount, type ExchangeRates } from "@/lib/currency/convert";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import type { ProjectionExpenseItem } from "@/lib/types/domain";

export interface PendingPeriodSummary {
  items: ProjectionExpenseItem[];
  totalDisplay: number;
  /** Pending amount per original currency (converted to the display currency), in `currencies` order. */
  byCurrency: { currency: CurrencyCode; amountDisplay: number }[];
  periodTotalDisplay: number;
}

/** Unpaid/projected charges in the current pay period, grouped for the pending modal. */
export function buildPendingPeriodSummary(
  items: ProjectionExpenseItem[],
  periodTotalDisplay: number,
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
): PendingPeriodSummary {
  const pending = items
    .filter((item) => item.projected)
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));

  let totalDisplay = 0;
  const byCurrency = new Map<CurrencyCode, number>();

  for (const item of pending) {
    totalDisplay += item.convertedAmount;
    byCurrency.set(
      item.currency,
      (byCurrency.get(item.currency) ?? 0) +
        convertAmount(item.amount, item.currency, displayCurrency, rates),
    );
  }

  return {
    items: pending,
    totalDisplay,
    byCurrency: currencies
      .filter((currency) => byCurrency.has(currency))
      .map((currency) => ({ currency, amountDisplay: byCurrency.get(currency)! })),
    periodTotalDisplay,
  };
}
