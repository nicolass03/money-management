import type { Account, CurrencyCode } from "@/lib/types/domain";
import { apiFetch } from "./client";

export interface AccountInput {
  name: string | null;
  currency: CurrencyCode;
  initialAmount: number;
}

export async function getAccounts(): Promise<Account[]> {
  return apiFetch<Account[]>("/api/v1/accounts");
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
  return apiFetch<Account>(`/api/v1/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await apiFetch(`/api/v1/accounts/${id}`, { method: "DELETE" });
}
