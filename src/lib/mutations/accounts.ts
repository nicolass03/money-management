import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from "@/lib/api/accounts";
import { invalidateAfter } from "@/lib/query/invalidation";
import { parseRateToBps } from "@/lib/accounts/interest";
import {
  currencies,
  type CurrencyCode,
  type InterestRateType,
} from "@/lib/types/constants";
import { tError } from "@/lib/i18n/errors";
import { parseToMinorUnits } from "@/lib/currency/input";
import { mutationError, type FormResult } from "./types";

export interface AccountFormInput {
  name: string;
  currency: string;
  initialAmount: string;
  excludeFromProjections: boolean;
  /** Percent text, e.g. "8.25"; blank = no interest. */
  interestRate: string;
  interestRateType: InterestRateType;
}

function validateAccountInput(data: AccountFormInput):
  | { error: string }
  | {
      data: {
        name: string | null;
        currency: CurrencyCode;
        initialAmount: number;
        excludeFromProjections: boolean;
        interestRateBps: number;
        interestRateType: InterestRateType;
      };
    } {
  const name = data.name.trim();
  if (!currencies.includes(data.currency as CurrencyCode)) {
    return { error: tError("invalidCurrency") };
  }
  const initialAmount = parseToMinorUnits(
    data.initialAmount || "0",
    data.currency as CurrencyCode,
  );
  if (initialAmount === null || initialAmount < 0) {
    return { error: tError("invalidAmount") };
  }
  const interestRateBps = parseRateToBps(data.interestRate);
  if (interestRateBps === null) {
    return { error: tError("invalidInterestRate") };
  }
  return {
    data: {
      name: name || null,
      currency: data.currency as CurrencyCode,
      initialAmount,
      excludeFromProjections: data.excludeFromProjections,
      interestRateBps,
      interestRateType: data.interestRateType,
    },
  };
}

export async function createAccountMutation(
  input: AccountFormInput,
): Promise<FormResult> {
  const result = validateAccountInput(input);
  if ("error" in result) return result;
  try {
    await createAccount(result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedCreateAccount"));
  }
}

export async function updateAccountMutation(
  id: string,
  input: AccountFormInput,
): Promise<FormResult> {
  const result = validateAccountInput(input);
  if ("error" in result) return result;
  try {
    await updateAccount(id, result.data);
    return { success: true };
  } catch (error) {
    // Surface the real failure (validation, network, 5xx, a genuine 404) rather than always
    // reporting "account not found".
    return mutationError(error, tError("failedUpdateAccount"));
  }
}

export async function deleteAccountMutation(id: string): Promise<FormResult> {
  try {
    await deleteAccount(id);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedDeleteAccount"));
  }
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAccountMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "accountChange");
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AccountFormInput }) =>
      updateAccountMutation(id, input),
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "accountChange");
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAccountMutation,
    onSuccess: (result) => {
      if (result.success) void invalidateAfter(queryClient, "accountChange");
    },
  });
}
