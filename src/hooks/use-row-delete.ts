import { useState } from "react";
import type { FormResult } from "@/lib/mutations/types";

/**
 * Confirmed delete for a list of rows: asks first, tracks which row is pending, and keeps the
 * failure message for that row (mutations resolve with `{ error }` instead of throwing).
 */
export function useRowDelete(
  deleteRow: (id: string) => Promise<FormResult>,
  confirmMessage: string,
) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ id: string; message: string } | null>(null);

  async function remove(id: string) {
    if (!window.confirm(confirmMessage)) return;
    setFailure(null);
    setPendingId(id);
    const result = await deleteRow(id);
    setPendingId(null);
    if (result.error) setFailure({ id, message: result.error });
  }

  return {
    remove,
    isPending: (id: string) => pendingId === id,
    errorFor: (id: string) => (failure?.id === id ? failure.message : null),
  };
}
