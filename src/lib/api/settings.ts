
import type { AppLanguage, CurrencyCode, UserSettings } from "@/lib/types/domain";
import { apiFetch } from "./client";

export type { UserSettings };

export async function getUserSettingsFromApi(): Promise<UserSettings> {
  return apiFetch<UserSettings>("/api/v1/settings");
}

export interface PatchSettingsInput {
  displayCurrency?: CurrencyCode;
  language?: AppLanguage;
  primaryScheduleId?: string | null;
  projectionStartDate?: string | null;
  projectionEndDate?: string | null;
  asOf?: string;
  extraSpentLimit?: number | null;
  theme?: string;
}

export async function patchSettings(
  data: PatchSettingsInput,
): Promise<UserSettings> {
  return apiFetch<UserSettings>("/api/v1/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
