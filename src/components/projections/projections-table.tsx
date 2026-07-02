"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePrivacyMode } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { maskNumericValue } from "@/lib/privacy/mask";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import { formatProjectionExpenseAmount } from "@/lib/currency/expense-display";
import { ExpenseAmount } from "@/components/expenses/expense-amount";
import type { ProjectionRow } from "@/lib/projections/build-projection";
import { isCurrentProjectionPeriod } from "@/lib/projections/projection-display";
import { useProjectionPeriodItems } from "@/hooks/use-queries";
import { cn, formatDate } from "@/lib/utils";

interface ProjectionsTableProps extends MoneyDisplayContext {
  rows: ProjectionRow[];
}

function formatPeriodRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export function ProjectionsTable({
  rows,
  displayCurrency,
  rates,
}: ProjectionsTableProps) {
  const { t } = useTranslation(["projections", "common"]);
  const { privacyMode } = usePrivacyMode();
  const [expandedPayDate, setExpandedPayDate] = useState<string | null>(null);

  function toggleRow(payDate: string) {
    setExpandedPayDate((current) => (current === payDate ? null : payDate));
  }

  // Past periods come from the frozen history table with aggregates only; fetch their expense
  // breakdown on demand when opened. Live (current/future) rows already carry their items inline.
  const expandedRow = rows.find((row) => row.payDate === expandedPayDate) ?? null;
  const needsLazyItems =
    !!expandedRow && expandedRow.isPast && expandedRow.expenseItems.length === 0;
  const lazyItems = useProjectionPeriodItems(
    needsLazyItems ? expandedPayDate : null,
    needsLazyItems,
  );

  function formatDisplay(amount: number) {
    const formatted = formatMoney(
      amount,
      displayCurrency,
      displayCurrency,
      rates,
    );
    return privacyMode ? maskNumericValue(formatted) : formatted;
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border px-4 py-3 font-mono text-xs text-muted">
        <span>{t("projections:colPayDate")}</span>
        <span className="text-right">{t("projections:colIncome")}</span>
        <span className="text-right">{t("projections:colPlannedSpend")}</span>
        <span className="text-right">{t("projections:colFree")}</span>
        <span className="text-right">{t("projections:colCumulative")}</span>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row) => {
          const isExpanded = expandedPayDate === row.payDate;
          const isCurrent = isCurrentProjectionPeriod(row);

          return (
            <div key={row.payDate}>
              <button
                type="button"
                onClick={() => toggleRow(row.payDate)}
                className={cn(
                  "grid w-full grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 text-left transition-colors hover:bg-surface/60",
                  isCurrent && "bg-surface-elevated/80",
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono text-xs text-muted transition-transform",
                        isExpanded && "rotate-90",
                      )}
                    >
                      ▶
                    </span>
                    <p className="font-mono text-sm text-text">
                      {formatDate(row.payDate)}
                    </p>
                    {(isCurrent || !row.isPast) && (
                      <Badge variant={isCurrent ? "accent" : "default"}>
                        {isCurrent
                          ? t("projections:badgeCurrent")
                          : t("projections:badgeProjected")}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 pl-5 font-mono text-xs text-muted">
                    {formatPeriodRange(row.startDate, row.endDate)}
                  </p>
                </div>

                <span className="self-center text-right font-mono text-sm text-success">
                  +{formatDisplay(row.incomeTotal)}
                </span>
                <span className="self-center text-right font-mono text-sm text-danger">
                  -{formatDisplay(row.expenseTotal)}
                </span>
                <span
                  className={cn(
                    "self-center text-right font-mono text-sm",
                    row.periodFree >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {row.periodFree >= 0 ? "+" : ""}
                  {formatDisplay(row.periodFree)}
                </span>
                <span
                  className={cn(
                    "self-center text-right font-mono text-sm",
                    row.cumulativeFree >= 0 ? "text-accent-glow" : "text-danger",
                  )}
                >
                  {formatDisplay(row.cumulativeFree)}
                </span>
              </button>

              {isExpanded && (() => {
                const useLazy = row.isPast && row.expenseItems.length === 0;
                const items = useLazy
                  ? lazyItems.data ?? []
                  : row.expenseItems;
                const loading = useLazy && lazyItems.isPending;

                return (
                <div className="border-t border-border/60 bg-bg/40 px-4 py-3 pl-10">
                  {loading ? (
                    <p className="font-mono text-xs text-muted">
                      {t("projections:loadingPeriodExpenses")}
                    </p>
                  ) : items.length === 0 ? (
                    <p className="font-mono text-xs text-muted">
                      {t("projections:emptyPeriodExpenses")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-mono text-xs text-muted">
                        {t("projections:expensesInPeriod")}
                      </p>
                      {items.map((item) => (
                        <div
                          key={`${item.budgetId ?? item.id ?? item.name}-${item.date}`}
                          className="flex items-center justify-between font-mono text-xs"
                        >
                          <div>
                            <p className="text-text">{item.name}</p>
                            <p className="text-muted">
                              {formatDate(item.date)} {"//"}{" "}
                              {item.tags.length > 0
                                ? item.tags.join(", ")
                                : t("common:untagged")}
                              {item.budgetId != null ? ` ${t("projections:metaBudget")}` : ""}
                              {item.isSubscription ? ` ${t("projections:metaSubscription")}` : ""}
                              {item.projected
                                ? ` ${t("projections:metaProjected")}`
                                : ` ${t("projections:metaActual")}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <ExpenseAmount
                              amount={formatProjectionExpenseAmount(
                                item,
                                displayCurrency,
                                rates,
                              )}
                              className="text-xs text-danger"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
