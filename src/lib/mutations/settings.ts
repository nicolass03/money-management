import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getMoneyContext } from "@/lib/api/money-context";
import { patchSettings } from "@/lib/api/settings";
import { invalidateAfter } from "@/lib/query/invalidation";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { parseSignedDollarsToCents } from "@/lib/utils";
import { mutationError, type FormResult } from "./types";

export async function updateDisplayCurrencyMutation(
  displayCurrency: string,
): Promise<FormResult> {
  if (!currencies.includes(displayCurrency as CurrencyCode)) {
    return { error: "invalid currency" };
  }
  try {
    await patchSettings({ displayCurrency: displayCurrency as CurrencyCode });
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to update currency");
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
    return { error: "invalid initial free money amount" };
  }
  if (projectionStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(projectionStartDate)) {
    return { error: "invalid projection start date" };
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
      if (!id) return { error: "invalid schedule" };
      await patchSettings({
        primaryScheduleId: id,
        projectionInitialFreeMoney: initialFreeMoney,
        projectionStartDate,
      });
    }
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to update projection settings");
  }
}

export async function refreshExchangeRatesMutation(): Promise<FormResult> {
  try {
    await getMoneyContext({ forceRefresh: true });
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to refresh exchange rates");
  }
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

export function useRefreshExchangeRates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshExchangeRatesMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "settingsChange");
    },
  });
}
