"use server";

import { handleActionError } from "@/lib/actions/action-error";
import { revalidatePath } from "next/cache";
import { getMoneyContext } from "@/lib/api/money-context";
import { patchSettings } from "@/lib/api/settings";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { parseSignedDollarsToCents } from "@/lib/utils";

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

function revalidateSettingsPaths() {
  revalidatePath("/settings");
  revalidatePath("/projections");
  revalidatePath("/income");
  revalidatePath("/expenses");
  revalidatePath("/savings");
}

export async function updateDisplayCurrency(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const currency = String(formData.get("displayCurrency") ?? "");

  if (!currencies.includes(currency as CurrencyCode)) {
    return { error: "invalid currency" };
  }

  try {
    await patchSettings({
      displayCurrency: currency as CurrencyCode,
    });
    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return handleActionError(error, "failed to update currency");
  }
}

export async function updateProjectionSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const raw = String(formData.get("primaryScheduleId") ?? "");
  const initialFreeMoney = parseSignedDollarsToCents(
    String(formData.get("initialFreeMoney") ?? ""),
  );
  const startDateRaw = String(formData.get("projectionStartDate") ?? "").trim();
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
      if (!id) {
        return { error: "invalid schedule" };
      }
      await patchSettings({
        primaryScheduleId: id,
        projectionInitialFreeMoney: initialFreeMoney,
        projectionStartDate,
      });
    }
    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return handleActionError(error, "failed to update projection settings");
  }
}

export async function refreshExchangeRates(): Promise<SettingsFormState> {
  try {
    await getMoneyContext({ forceRefresh: true });
    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return handleActionError(error, "failed to refresh exchange rates");
  }
}
