
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
  projectionInitialFreeMoney?: number;
  projectionStartDate?: string | null;
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
