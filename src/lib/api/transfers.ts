import type {
  CurrencyCode,
  PayFrequency,
  RecurringTransfer,
  Transfer,
} from "@/lib/types/domain";
import { apiFetch } from "./client";

interface TransferBase {
  name: string | null;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  /** The currency `amount` was parsed in; the API checks it against both accounts. */
  currency: CurrencyCode;
}

export interface TransferInput extends TransferBase {
  date: string;
}

export interface RecurringTransferInput extends TransferBase {
  anchorDate: string;
  frequency: PayFrequency;
}

export async function getTransfers(): Promise<Transfer[]> {
  return apiFetch<Transfer[]>("/api/v1/transfers");
}

export async function createTransfer(data: TransferInput): Promise<Transfer> {
  return apiFetch<Transfer>("/api/v1/transfers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTransfer(id: string, data: TransferInput): Promise<Transfer> {
  return apiFetch<Transfer>(`/api/v1/transfers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTransfer(id: string): Promise<void> {
  await apiFetch(`/api/v1/transfers/${id}`, { method: "DELETE" });
}

export async function getRecurringTransfers(): Promise<RecurringTransfer[]> {
  return apiFetch<RecurringTransfer[]>("/api/v1/recurring-transfers");
}

export async function createRecurringTransfer(
  data: RecurringTransferInput,
): Promise<RecurringTransfer> {
  return apiFetch<RecurringTransfer>("/api/v1/recurring-transfers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRecurringTransfer(
  id: string,
  data: RecurringTransferInput,
): Promise<RecurringTransfer> {
  return apiFetch<RecurringTransfer>(`/api/v1/recurring-transfers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteRecurringTransfer(id: string): Promise<void> {
  await apiFetch(`/api/v1/recurring-transfers/${id}`, { method: "DELETE" });
}
