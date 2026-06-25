"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TerminalModal } from "@/components/ui/terminal-modal";
import { useSetCancelReminder } from "@/lib/mutations/recurring-expenses";
import { getUpcomingPayDates, scheduleToInput } from "@/lib/income/pay-periods";
import type { RecurringExpenseWithTags } from "@/lib/types/domain";
import { formatDate } from "@/lib/utils";

interface CancelReminderDialogProps {
  open: boolean;
  onClose: () => void;
  subscriptions: RecurringExpenseWithTags[];
}

function nextChargeDate(sub: RecurringExpenseWithTags): string | null {
  return getUpcomingPayDates(scheduleToInput(sub), 1)[0] ?? null;
}

export function CancelReminderDialog({
  open,
  onClose,
  subscriptions,
}: CancelReminderDialogProps) {
  const { t } = useTranslation(["expenses", "common"]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const setReminder = useSetCancelReminder();

  const selected =
    subscriptions.find((sub) => sub.id === selectedId) ?? null;

  function handleClose() {
    setSelectedId(null);
    setError("");
    onClose();
  }

  // Drop the selection if the chosen subscription disappears (e.g. deleted elsewhere).
  useEffect(() => {
    if (selectedId && !subscriptions.some((sub) => sub.id === selectedId)) {
      setSelectedId(null);
    }
  }, [subscriptions, selectedId]);

  async function handleConfirm() {
    if (!selected) return;
    setError("");
    const result = await setReminder.mutateAsync({
      id: selected.id,
      enabled: !selected.cancelReminderEnabled,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    handleClose();
  }

  return (
    <TerminalModal
      open={open}
      onClose={handleClose}
      title={t("expenses:cancelReminderTitle")}
      subtitle={
        selected
          ? t("expenses:cancelReminderConfirmSubtitle")
          : t("expenses:cancelReminderSelectSubtitle")
      }
    >
      {subscriptions.length === 0 ? (
        <p className="font-mono text-sm text-muted">
          {t("expenses:cancelReminderNoSubscriptions")}
        </p>
      ) : selected ? (
        <div className="space-y-4">
          <div>
            <p className="font-mono text-sm text-text">{selected.name}</p>
            {nextChargeDate(selected) ? (
              <p className="font-mono text-xs text-muted">
                {selected.cancelReminderEnabled
                  ? t("expenses:cancelReminderRemoveText", { name: selected.name })
                  : t("expenses:cancelReminderConfirmText", {
                      name: selected.name,
                      date: formatDate(nextChargeDate(selected)!),
                    })}
              </p>
            ) : (
              <p className="font-mono text-xs text-muted">
                {t("expenses:cancelReminderNoCharge")}
              </p>
            )}
          </div>

          {error && <p className="font-mono text-xs text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant={selected.cancelReminderEnabled ? "ghost" : "danger"}
              loading={setReminder.isPending}
              onClick={handleConfirm}
            >
              {selected.cancelReminderEnabled
                ? t("expenses:cancelReminderRemove")
                : t("expenses:cancelReminderConfirm")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSelectedId(null);
                setError("");
              }}
            >
              {t("common:back")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {subscriptions.map((sub) => {
            const next = nextChargeDate(sub);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setSelectedId(sub.id);
                  setError("");
                }}
                className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:text-accent"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-text">{sub.name}</p>
                    {sub.cancelReminderEnabled && (
                      <Badge variant="accent">
                        {t("expenses:reminderSet")}
                      </Badge>
                    )}
                  </div>
                  {next && (
                    <p className="font-mono text-xs text-muted">
                      {t("expenses:cancelReminderNextCharge", {
                        date: formatDate(next),
                      })}
                    </p>
                  )}
                </div>
                <span className="font-mono text-xs text-muted">›</span>
              </button>
            );
          })}
        </div>
      )}
    </TerminalModal>
  );
}
