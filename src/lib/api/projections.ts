
import type {
  CurrencyCode,
  IncomePaySchedule,
  ProjectionRow,
} from "@/lib/types/domain";
import type { ExchangeRates } from "@/lib/currency/convert";
import { localTodayIso } from "@/lib/date/local-today";
import { apiFetch } from "./client";

export interface ProjectionsResponse {
  rows: ProjectionRow[];
  primarySchedule: IncomePaySchedule;
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
}

export async function getProjectionsFromApi(): Promise<ProjectionsResponse> {
  const params = new URLSearchParams({ asOf: localTodayIso() });
  return apiFetch<ProjectionsResponse>(
    `/api/v1/projections?${params.toString()}`,
  );
}
