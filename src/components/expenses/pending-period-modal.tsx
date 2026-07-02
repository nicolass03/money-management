import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TerminalModal } from "@/components/ui/terminal-modal";
import { MoneyText } from "@/components/layout/privacy-mode";
import { getExpensePeriodView } from "@/lib/api/expenses";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import { buildPendingPeriodSummary } from "@/lib/expenses/pending-period-summary";
import { queryKeys } from "@/lib/query/query-keys";
import type { ExpensePeriodView } from "@/lib/types/domain";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PendingPeriodModalProps extends MoneyDisplayContext {
  open: boolean;
  onClose: () => void;
  /** Warm cache from the dashboard when the pay-period tab is active. */
  cachedPeriodView?: ExpensePeriodView | null;
  hasPrimarySchedule: boolean;
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 font-mono text-sm">
      <span className="text-muted">{label}</span>
      <MoneyText value={value} className="text-text" />
    </div>
  );
}

export function PendingPeriodModal({
  open,
  onClose,
  cachedPeriodView,
  hasPrimarySchedule,
  displayCurrency,
  rates,
}: PendingPeriodModalProps) {
  const { t } = useTranslation(["expenses", "common"]);

  const canUseCache = cachedPeriodView?.isPayPeriod === true;
  const payPeriodQuery = useQuery({
    queryKey: queryKeys.expensePeriodView("last-period"),
    queryFn: () => getExpensePeriodView("last-period"),
    enabled: open && !canUseCache,
  });

  const periodView = canUseCache ? cachedPeriodView : payPeriodQuery.data ?? null;
  const loading = open && !canUseCache && payPeriodQuery.isLoading;

  const summary =
    periodView?.isPayPeriod && periodView.items
      ? buildPendingPeriodSummary(
          periodView.items,
          periodView.totalSpend,
          displayCurrency,
          rates,
        )
      : null;

  function formatDisplay(amountMinor: number) {
    return formatMoney(amountMinor, displayCurrency, displayCurrency, rates);
  }

  return (
    <TerminalModal
      open={open}
      onClose={onClose}
      title={t("expenses:pendingPeriodTitle")}
      subtitle={t("expenses:pendingPeriodSubtitle")}
    >
      {!hasPrimarySchedule ? (
        <p className="font-mono text-sm text-muted">{t("expenses:pendingPeriodNoSchedule")}</p>
      ) : loading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : !summary ? (
        <p className="font-mono text-sm text-muted">{t("expenses:pendingPeriodUnavailable")}</p>
      ) : (
        <div className="space-y-6">
          <section>
            <p className="mb-3 font-mono text-xs text-muted">
              {t("expenses:pendingPeriodListHeading")}
            </p>
            {summary.items.length === 0 ? (
              <p className="font-mono text-sm text-muted">{t("expenses:pendingPeriodEmpty")}</p>
            ) : (
              <div className="divide-y divide-border/60">
                {summary.items.map((item) => (
                    <div
                      key={item.id ?? `pending-${item.recurringId ?? item.plannedExpenseId ?? item.budgetId}-${item.date}`}
                      className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-sm text-text">{item.name}</p>
                          {item.isSubscription && (
                            <Badge variant="default">{t("expenses:subscription")}</Badge>
                          )}
                          {item.budgetId && (
                            <Badge variant="default">{t("expenses:badgeBudget")}</Badge>
                          )}
                        </div>
                        <p className="font-mono text-xs text-muted">
                          {t("expenses:rowDue", { date: formatDate(item.date) })}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-sm text-danger">
                        <MoneyText value={`-${formatDisplay(item.convertedAmount)}`} />
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section className="space-y-2 border-t border-border pt-4">
            <SummaryRow
              label={t("expenses:pendingEur")}
              value={formatDisplay(summary.pendingEurDisplay)}
            />
            <SummaryRow
              label={t("expenses:pendingUsd")}
              value={formatDisplay(summary.pendingUsdDisplay)}
            />
            <SummaryRow
              label={t("expenses:pendingTotal")}
              value={formatDisplay(summary.totalDisplay)}
            />
            <SummaryRow
              label={t("expenses:periodExpensesTotal")}
              value={formatDisplay(summary.periodTotalDisplay)}
            />
          </section>
        </div>
      )}
    </TerminalModal>
  );
}

interface PendingPeriodButtonProps extends MoneyDisplayContext {
  cachedPeriodView?: ExpensePeriodView | null;
  hasPrimarySchedule: boolean;
}

export function PendingPeriodButton({
  cachedPeriodView,
  hasPrimarySchedule,
  displayCurrency,
  rates,
}: PendingPeriodButtonProps) {
  const { t } = useTranslation("expenses");
  const [open, setOpen] = useState(false);

  const previewCount =
    cachedPeriodView?.isPayPeriod
      ? cachedPeriodView.items.filter((item) => item.projected).length
      : null;

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        disabled={!hasPrimarySchedule}
        onClick={() => setOpen(true)}
      >
        {t("pendingPeriodButton")}
        {previewCount != null && previewCount > 0 && (
          <span className="ml-1.5 font-mono text-xs text-muted">({previewCount})</span>
        )}
      </Button>

      <PendingPeriodModal
        open={open}
        onClose={() => setOpen(false)}
        cachedPeriodView={cachedPeriodView}
        hasPrimarySchedule={hasPrimarySchedule}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </>
  );
}
