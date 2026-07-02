import { useState } from "react";
import type { CurrencyCode } from "@/lib/types/constants";
import type { Account } from "@/lib/types/domain";

interface EntryAccountSource {
  accountId?: string | null;
  currency?: CurrencyCode;
}

/**
 * Resolves the account + currency for an entry form (expense / income / planned / schedule).
 * Currency follows the selected account.
 *
 * The important guarantee: when *editing* a row whose account is no longer active (archived or
 * removed, so it's absent from `accounts`), this keeps the row's own account id and its stored
 * currency instead of silently falling back to the first account. Without this, saving an edited
 * row would move the money to a different account and reinterpret its amount in another currency.
 * New entries (no `entry`) default to the first account.
 */
export function useEntryAccount(accounts: Account[], entry?: EntryAccountSource) {
  const isEditing = Boolean(entry);
  const [accountId, setAccountId] = useState(entry?.accountId ?? "");
  const activeMatch = accounts.find((a) => a.id === accountId);

  // The account currently attached to the row (or the default for a new row). May be an archived
  // account id that is not present in `accounts` when editing.
  const currentAccountId =
    activeMatch?.id ?? (isEditing ? entry?.accountId ?? "" : accounts[0]?.id ?? "");
  const currency: CurrencyCode =
    activeMatch?.currency ??
    (isEditing ? entry?.currency : accounts[0]?.currency) ??
    "usd";

  return {
    setAccountId,
    /** Value for the AccountSelect + the id to submit; may reference an archived account. */
    currentAccountId,
    /** null-safe account id for the request payload. */
    submitAccountId: currentAccountId || null,
    currency,
  };
}
