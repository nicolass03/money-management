import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getMoneyContext } from "@/lib/api/money-context";
import { patchSettings } from "@/lib/api/settings";
import { tError } from "@/lib/i18n/errors";
import { invalidateAfter } from "@/lib/query/invalidation";
import { isThemeCode } from "@/lib/theme/themes";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import type { AppLanguage } from "@/lib/types/domain";
import { parseDollarsToCents, parseSignedDollarsToCents } from "@/lib/utils";
import { mutationError, type FormResult } from "./types";

export async function updateDisplayCurrencyMutation(
  displayCurrency: string,
): Promise<FormResult> {
  if (!currencies.includes(displayCurrency as CurrencyCode)) {
    return { error: tError("invalidCurrency") };
  }
  try {
    await patchSettings({ displayCurrency: displayCurrency as CurrencyCode });
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateCurrency"));
  }
}

export async function updateLanguageMutation(language: AppLanguage): Promise<FormResult> {
  if (language !== "en" && language !== "es") {
    return { error: tError("invalidLanguage") };
  }
  try {
    await patchSettings({ language });
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateLanguage"));
  }
}

export async function updateThemeMutation(code: string): Promise<FormResult> {
  if (!isThemeCode(code)) {
    return { error: tError("invalidTheme") };
  }
  try {
    await patchSettings({ theme: code });
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateTheme"));
  }
}

export interface ProjectionSettingsInput {
  primaryScheduleId: string;
  initialFreeMoney: string;
  projectionStartDate: string;
}

export async function updateProjectionSettingsMutation(
  input: ProjectionSettingsInput,
): Promise<FormResult> {
  const raw = input.primaryScheduleId;
  const initialFreeMoney = parseSignedDollarsToCents(input.initialFreeMoney);
  const startDateRaw = input.projectionStartDate.trim();
  const projectionStartDate = startDateRaw || null;

  if (initialFreeMoney === null) {
    return { error: tError("invalidInitialFreeMoneyAmount") };
  }
  if (projectionStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(projectionStartDate)) {
    return { error: tError("invalidProjectionStartDate") };
  }

  try {
    if (!raw) {
      await patchSettings({
        primaryScheduleId: null,
        projectionInitialFreeMoney: initialFreeMoney,
        projectionStartDate,
      });
    } else {
      const id = raw.trim();
      if (!id) return { error: tError("invalidSchedule") };
      await patchSettings({
        primaryScheduleId: id,
        projectionInitialFreeMoney: initialFreeMoney,
        projectionStartDate,
      });
    }
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateProjectionSettings"));
  }
}

export async function updateExtraSpentLimitMutation(
  rawLimit: string,
): Promise<FormResult> {
  const trimmed = rawLimit.trim();

  // An empty input clears the limit; any value must be a positive amount.
  if (!trimmed) {
    try {
      await patchSettings({ extraSpentLimit: null });
      return { success: true };
    } catch (error) {
      return mutationError(error, tError("failedUpdateExtraSpentLimit"));
    }
  }

  const limit = parseDollarsToCents(trimmed);
  if (limit === null || limit <= 0) {
    return { error: tError("invalidExtraSpentLimit") };
  }

  try {
    await patchSettings({ extraSpentLimit: limit });
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateExtraSpentLimit"));
  }
}

export async function refreshExchangeRatesMutation(): Promise<FormResult> {
  try {
    await getMoneyContext({ forceRefresh: true });
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedRefreshExchangeRates"));
  }
}

export function useUpdateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateLanguageMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "settingsChange");
    },
  });
}

export function useUpdateTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateThemeMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "settingsChange");
    },
  });
}

export function useUpdateDisplayCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDisplayCurrencyMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "settingsChange");
    },
  });
}

export function useUpdateProjectionSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProjectionSettingsMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "settingsChange");
    },
  });
}

export function useUpdateExtraSpentLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateExtraSpentLimitMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "settingsChange");
    },
  });
}

export function useRefreshExchangeRates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshExchangeRatesMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "settingsChange");
    },
  });
}
