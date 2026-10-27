import type {
  Account,
  CurrencyCode,
  InterestCredit,
  InterestRateType,
} from "@/lib/types/domain";
import { localTodayIso } from "@/lib/date/local-today";
import { apiFetch } from "./client";

/** Balances are computed as of the user's local today; turning interest on starts accruing then. */
function asOfQuery(): string {
  return new URLSearchParams({ asOf: localTodayIso() }).toString();
}

export interface AccountInput {
  name: string | null;
  currency: CurrencyCode;
  initialAmount: number;
  excludeFromProjections: boolean;
  interestRateBps: number;
  interestRateType: InterestRateType;
}

export async function getAccounts(): Promise<Account[]> {
  return apiFetch<Account[]>(`/api/v1/accounts?${asOfQuery()}`);
}

export async function createAccount(data: AccountInput): Promise<Account> {
  return apiFetch<Account>(`/api/v1/accounts?${asOfQuery()}`, {
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

/** The account's daily interest credits, newest first. */
export async function getAccountInterest(id: string): Promise<InterestCredit[]> {
  return apiFetch<InterestCredit[]>(`/api/v1/accounts/${id}/interest`);
}

export async function deleteAccount(id: string): Promise<void> {
  await apiFetch(`/api/v1/accounts/${id}`, { method: "DELETE" });
}
