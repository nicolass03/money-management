import "server-only";

import type { CurrencyCode, UserSettings } from "@/lib/types/domain";
import { apiFetch } from "./client";

export type { UserSettings };

export async function getUserSettingsFromApi(): Promise<UserSettings> {
  return apiFetch<UserSettings>("/api/v1/settings");
}

export interface PatchSettingsInput {
  displayCurrency?: CurrencyCode;
  primaryScheduleId?: string | null;
  projectionInitialFreeMoney?: number;
  projectionStartDate?: string | null;
}

export async function patchSettings(
  data: PatchSettingsInput,
): Promise<UserSettings> {
  return apiFetch<UserSettings>("/api/v1/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
