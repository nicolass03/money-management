
import type { CurrencyCode, Income } from "@/lib/types/domain";
import { apiFetch } from "./client";

export interface IncomeInput {
  name: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  accountId?: string | null;
}

export async function getIncome(): Promise<Income[]> {
  return apiFetch<Income[]>("/api/v1/income");
}

export async function createIncome(data: IncomeInput): Promise<Income> {
  return apiFetch<Income>("/api/v1/income", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIncome(
  id: string,
  data: IncomeInput,
): Promise<Income> {
  return apiFetch<Income>(`/api/v1/income/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteIncome(id: string): Promise<void> {
  await apiFetch(`/api/v1/income/${id}`, { method: "DELETE" });
}
