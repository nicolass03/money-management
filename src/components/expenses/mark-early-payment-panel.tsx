import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TerminalModal } from "@/components/ui/terminal-modal";
import { usePrivacyMode } from "@/components/layout/privacy-mode";
import { useMarkFuturePaymentAsPaid } from "@/lib/mutations/expenses";
import { formatNativeMoney } from "@/lib/currency/format";
import { formatCurrencyLabel } from "@/lib/currency/types";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { maskNumericValue } from "@/lib/privacy/mask";
import type { PayableFutureItem } from "@/lib/types/domain";
import { cn, formatCentsAsDollarsInput, formatDate } from "@/lib/utils";

interface MarkEarlyPaymentPanelProps {
  upcomingItems: PayableFutureItem[];
  periodStartDate: string;
  periodEndDate: string;
  defaultPaidDate: string;
}

export function MarkEarlyPaymentPanel({
  upcomingItems,
  periodStartDate,
  periodEndDate,
  defaultPaidDate,
}: MarkEarlyPaymentPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("usd");
  const [paidDate, setPaidDate] = useState(defaultPaidDate);
  const [error, setError] = useState("");
  const markPaid = useMarkFuturePaymentAsPaid();
  const { privacyMode } = usePrivacyMode();

  function formatItemAmount(item: PayableFutureItem) {
    const formatted = formatNativeMoney(item.amount, item.currency);
    return privacyMode ? maskNumericValue(formatted) : formatted;
  }

  const selected =
    upcomingItems.find((item) => item.key === selectedKey) ?? null;

  function resetForm() {
    setSelectedKey(null);
    setAmount("");
    setCurrency("usd");
    setPaidDate(defaultPaidDate);
    setError("");
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  useEffect(() => {
    if (!selected) {
      return;
    }
    setAmount(formatCentsAsDollarsInput(selected.amount));
    setCurrency(selected.currency);
    setPaidDate(defaultPaidDate);
  }, [selected, defaultPaidDate]);

  useEffect(() => {
    if (!markPaid.isSuccess) {
      return;
    }

    handleClose();
    markPaid.reset();
  }, [markPaid.isSuccess, defaultPaidDate, markPaid]);

  function handleSelect(item: PayableFutureItem) {
    setSelectedKey(item.key);
    setAmount(formatCentsAsDollarsInput(item.amount));
    setCurrency(item.currency);
    setPaidDate(defaultPaidDate);
    setError("");
  }

  return (
    <>
      <Card className="mt-4 overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface/60"
        >
          <p className="font-mono text-sm text-text">mark as paid</p>
          <div className="flex items-center gap-2">
            {upcomingItems.length > 0 && (
              <Badge variant="default">{upcomingItems.length}</Badge>
            )}
            <span className="font-mono text-xs text-muted">›</span>
          </div>
        </button>
      </Card>

      <TerminalModal
        open={open}
        onClose={handleClose}
        title="mark-as-paid"
        subtitle={
          selected
            ? "confirm payment details"
            : "select an upcoming charge to mark as paid"
        }
      >
        {upcomingItems.length === 0 ? (
          <p className="font-mono text-sm text-muted">
            {"> no upcoming payments in the next 30 days."}
          </p>
        ) : selected ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              const result = await markPaid.mutateAsync({
                sourceType: selected.sourceType,
                scheduledDate: selected.scheduledDate,
                paidDate,
                amount,
                currency,
                recurringId: selected.recurringId ?? undefined,
                plannedExpenseId: selected.plannedExpenseId ?? undefined,
              });
              if (result.error) setError(result.error);
            }}
            className="space-y-4"
          >
            <div>
              <p className="font-mono text-sm text-text">{selected.name}</p>
              <p className="font-mono text-xs text-muted">
                due {formatDate(selected.scheduledDate)}
                {selected.sourceType === "recurring" ? " // recurring" : " // one-time"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="early-amount"
                  className="mb-2 block font-mono text-xs text-muted"
                >
                  amount paid:
                </label>
                <Input
                  id="early-amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="early-currency"
                  className="mb-2 block font-mono text-xs text-muted"
                >
                  currency:
                </label>
                <select
                  id="early-currency"
                  name="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className={cn(
                    "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent",
                  )}
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {formatCurrencyLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="early-paid-date"
                className="mb-2 block font-mono text-xs text-muted"
              >
                paid date:
              </label>
              <Input
                id="early-paid-date"
                name="paidDate"
                type="date"
                value={paidDate}
                min={periodStartDate}
                max={periodEndDate}
                onChange={(e) => setPaidDate(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-danger">{error}</p>
            )}

            <div className="flex gap-2">
              <Button type="submit" loading={markPaid.isPending}>
                {markPaid.isPending ? "saving..." : "confirm payment"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => resetForm()}
              >
                back
              </Button>
            </div>
          </form>
        ) : (
          <div className="divide-y divide-border/60">
            {upcomingItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelect(item)}
                className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:text-accent"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-text">{item.name}</p>
                    {item.isSubscription && (
                      <Badge variant="default">subscription</Badge>
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted">
                    due {formatDate(item.scheduledDate)} {"//"}{" "}
                    {item.sourceType === "recurring" ? "recurring" : "one-time"}
                  </p>
                </div>
                <span className="font-mono text-sm text-danger">
                  -{formatItemAmount(item)}
                </span>
              </button>
            ))}
          </div>
        )}
      </TerminalModal>
    </>
  );
}
