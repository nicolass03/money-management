import "server-only";

import type { CurrencyCode } from "@/lib/types/domain";
import type { ExchangeRates } from "@/lib/currency/convert";
import { apiFetch } from "./client";

export interface MoneyContext {
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
}

export async function getMoneyContext(options?: {
  forceRefresh?: boolean;
}): Promise<MoneyContext> {
  const params = new URLSearchParams();
  if (options?.forceRefresh) {
    params.set("forceRefresh", "true");
  }
  const query = params.toString();
  return apiFetch<MoneyContext>(
    `/api/v1/money-context${query ? `?${query}` : ""}`,
  );
}
