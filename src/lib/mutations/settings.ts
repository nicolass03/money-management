import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getMoneyContext } from "@/lib/api/money-context";
import { patchSettings } from "@/lib/api/settings";
import { invalidateAfter } from "@/lib/query/invalidation";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { getMinorDivisor } from "@/lib/currency/types";
import { parseSignedDollarsToCents } from "@/lib/utils";
import { mutationError, type FormResult } from "./types";

function parseAmountInput(
  value: string,
  currency: CurrencyCode,
): number | null {
  const trimmed = value.trim().replace(/[$,]/g, "");
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * getMinorDivisor(currency));
}

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

export interface ExtraExpenseSettingsInput {
  amount: string;
  currency: string;
}

export async function updateExtraExpenseSettingsMutation(
  input: ExtraExpenseSettingsInput,
): Promise<FormResult> {
  const currencyRaw = input.currency.trim().toLowerCase();
  if (!currencies.includes(currencyRaw as CurrencyCode)) {
    return { error: "invalid currency" };
  }
  const currency = currencyRaw as CurrencyCode;
  const amountRaw = input.amount.trim();

  try {
    if (!amountRaw) {
      await patchSettings({
        extraExpenseLimit: null,
        extraExpenseLimitCurrency: null,
      });
      return { success: true };
    }

    const amount = parseAmountInput(amountRaw, currency);
    if (amount === null) {
      return { error: "invalid extra expense limit" };
    }

    await patchSettings({
      extraExpenseLimit: amount,
      extraExpenseLimitCurrency: currency,
    });
    return { success: true };
  } catch (error) {
    return mutationError(error, "failed to update extra expense limit");
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

export function useUpdateExtraExpenseSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateExtraExpenseSettingsMutation,
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
