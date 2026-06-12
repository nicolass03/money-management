import { convertAmount, type ExchangeRates } from "./convert";
import { formatNativeMoney } from "./format";
import type { CurrencyCode } from "./types";
import type { ProjectionExpenseItem } from "@/lib/projections/build-projection";

export interface FormattedExpenseAmount {
  primary: string;
  parenthetical?: string;
}

function formatParts(
  primary: string,
  parenthetical?: string,
): FormattedExpenseAmount {
  return parenthetical ? { primary, parenthetical } : { primary };
}

export function formatScheduledExpenseAmount(
  amountMinor: number,
  currency: CurrencyCode,
): FormattedExpenseAmount {
  return { primary: formatNativeMoney(amountMinor, currency) };
}

export function formatChargedExpenseAmount(
  amountMinor: number,
  currency: CurrencyCode,
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
  original?: { amount: number; currency: CurrencyCode },
): FormattedExpenseAmount {
  if (
    original &&
    (original.currency !== currency || original.amount !== amountMinor)
  ) {
    return formatParts(
      formatNativeMoney(amountMinor, currency),
      formatNativeMoney(original.amount, original.currency),
    );
  }

  if (currency !== displayCurrency) {
    const converted = convertAmount(
      amountMinor,
      currency,
      displayCurrency,
      rates,
    );
    return formatParts(
      formatNativeMoney(converted, displayCurrency),
      formatNativeMoney(amountMinor, currency),
    );
  }

  return { primary: formatNativeMoney(amountMinor, currency) };
}

export function formatBudgetSummaryAmount(
  spent: number,
  total: number,
  currency: CurrencyCode,
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
): FormattedExpenseAmount {
  const spentFormatted = formatChargedExpenseAmount(
    spent,
    currency,
    displayCurrency,
    rates,
  );
  const totalFormatted = formatChargedExpenseAmount(
    total,
    currency,
    displayCurrency,
    rates,
  );

  return {
    primary: `${spentFormatted.primary} / ${totalFormatted.primary}`,
  };
}

export function formatProjectionExpenseAmount(
  item: ProjectionExpenseItem,
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
): FormattedExpenseAmount {
  if (item.isBudgetSummary && item.budgetTotal != null && item.budgetSpent != null) {
    return formatBudgetSummaryAmount(
      item.budgetSpent,
      item.budgetTotal,
      item.currency,
      displayCurrency,
      rates,
    );
  }

  if (item.projected) {
    return formatScheduledExpenseAmount(item.amount, item.currency);
  }

  const original =
    item.originalAmount != null && item.originalCurrency != null
      ? { amount: item.originalAmount, currency: item.originalCurrency }
      : undefined;

  return formatChargedExpenseAmount(
    item.amount,
    item.currency,
    displayCurrency,
    rates,
    original,
  );
}

export function formatStoredExpenseAmount(
  amountMinor: number,
  currency: CurrencyCode,
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
  original?: { amount: number; currency: CurrencyCode },
): FormattedExpenseAmount {
  return formatChargedExpenseAmount(
    amountMinor,
    currency,
    displayCurrency,
    rates,
    original,
  );
}
