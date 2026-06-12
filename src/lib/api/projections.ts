import type {
  CurrencyCode,
  IncomePaySchedule,
  ProjectionRow,
} from "@/lib/types/domain";
import type { ExchangeRates } from "@/lib/currency/convert";
import { apiFetch } from "./client";

export interface ProjectionsResponse {
  rows: ProjectionRow[];
  primarySchedule: IncomePaySchedule;
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
}

export async function getProjectionsFromApi(): Promise<ProjectionsResponse> {
  return apiFetch<ProjectionsResponse>("/api/v1/projections");
}
