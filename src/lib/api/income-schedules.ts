
import type {
  CurrencyCode,
  IncomePaySchedule,
  PayFrequency,
} from "@/lib/types/domain";
import { apiFetch } from "./client";

export interface IncomeScheduleInput {
  name: string;
  anchorDate: string;
  frequency: PayFrequency;
  amount: number;
  currency: CurrencyCode;
  accountId?: string | null;
}

export async function getIncomeSchedules(): Promise<IncomePaySchedule[]> {
  return apiFetch<IncomePaySchedule[]>("/api/v1/income-schedules");
}

export async function getIncomeScheduleById(
  id: string,
): Promise<IncomePaySchedule | null> {
  try {
    return await apiFetch<IncomePaySchedule>(`/api/v1/income-schedules/${id}`);
  } catch {
    return null;
  }
}

export async function createIncomeSchedule(
  data: IncomeScheduleInput,
): Promise<IncomePaySchedule> {
  return apiFetch<IncomePaySchedule>("/api/v1/income-schedules", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIncomeSchedule(
  id: string,
  data: IncomeScheduleInput,
): Promise<IncomePaySchedule | null> {
  try {
    return await apiFetch<IncomePaySchedule>(`/api/v1/income-schedules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function deleteIncomeSchedule(id: string): Promise<void> {
  await apiFetch(`/api/v1/income-schedules/${id}`, { method: "DELETE" });
}
