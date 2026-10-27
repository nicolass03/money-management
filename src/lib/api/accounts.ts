import type { Account, CurrencyCode } from "@/lib/types/domain";
import { localTodayIso } from "@/lib/date/local-today";
import { apiFetch } from "./client";

/** Balances are computed as of the user's local today. */
function asOfQuery(): string {
  return new URLSearchParams({ asOf: localTodayIso() }).toString();
}

export interface AccountInput {
  name: string | null;
  currency: CurrencyCode;
  initialAmount: number;
  excludeFromProjections: boolean;
}

export async function getAccounts(): Promise<Account[]> {
  return apiFetch<Account[]>(`/api/v1/accounts?${asOfQuery()}`);
}

export async function createAccount(data: AccountInput): Promise<Account> {
  return apiFetch<Account>("/api/v1/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAccount(
  id: string,
  data: AccountInput,
): Promise<Account> {
  return apiFetch<Account>(`/api/v1/accounts/${id}?${asOfQuery()}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await apiFetch(`/api/v1/accounts/${id}`, { method: "DELETE" });
}
