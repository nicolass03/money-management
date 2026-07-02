
import type {
  CurrencyCode,
  IncomePaySchedule,
  ProjectionExpenseItem,
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

// Expense-item breakdown for a single (usually past) period, identified by its closing pay date.
// Past periods are served from the frozen history table with aggregates only, so the UI fetches
// their items on demand when the row is opened.
export async function getProjectionPeriodItems(
  payDate: string,
): Promise<ProjectionExpenseItem[]> {
  const params = new URLSearchParams({ payDate, asOf: localTodayIso() });
  const row = await apiFetch<ProjectionRow>(
    `/api/v1/projections/period-items?${params.toString()}`,
  );
  return row.expenseItems;
}
