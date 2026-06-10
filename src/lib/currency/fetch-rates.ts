import "server-only";

import type { ExchangeRates } from "./convert";

const RATES_API_URL = "https://open.er-api.com/v6/latest/USD";
const RATES_TTL_MS = 24 * 60 * 60 * 1000;

interface ApiResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc?: string;
}

export function isRatesStale(fetchedAt: string): boolean {
  const fetched = new Date(fetchedAt).getTime();
  return Date.now() - fetched > RATES_TTL_MS;
}

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const response = await fetch(RATES_API_URL, {
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`exchange rate API returned ${response.status}`);
  }

  const data = (await response.json()) as ApiResponse;

  if (data.result !== "success" || !data.rates) {
    throw new Error("exchange rate API returned invalid data");
  }

  return {
    base: data.base_code,
    rates: data.rates,
    fetchedAt: new Date().toISOString(),
  };
}

export function parseCachedRates(json: string | null): ExchangeRates | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as ExchangeRates;
    if (parsed.base && parsed.rates && parsed.fetchedAt) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeRates(rates: ExchangeRates): string {
  return JSON.stringify(rates);
}
