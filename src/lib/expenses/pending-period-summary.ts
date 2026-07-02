import { convertAmount, type ExchangeRates } from "@/lib/currency/convert";
import type { CurrencyCode } from "@/lib/types/constants";
import type { ProjectionExpenseItem } from "@/lib/types/domain";

export interface PendingPeriodSummary {
  items: ProjectionExpenseItem[];
  totalDisplay: number;
  pendingEurDisplay: number;
  pendingUsdDisplay: number;
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
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));

  let totalDisplay = 0;
  let pendingEurDisplay = 0;
  let pendingUsdDisplay = 0;

  for (const item of pending) {
    totalDisplay += item.convertedAmount;
    if (item.currency === "eur") {
      pendingEurDisplay += convertAmount(
        item.amount,
        item.currency,
        displayCurrency,
        rates,
      );
    } else if (item.currency === "usd") {
      pendingUsdDisplay += convertAmount(
        item.amount,
        item.currency,
        displayCurrency,
        rates,
      );
    }
  }

  return {
    items: pending,
    totalDisplay,
    pendingEurDisplay,
    pendingUsdDisplay,
    periodTotalDisplay: periodTotalDisplay,
  };
}
