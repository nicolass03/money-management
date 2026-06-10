"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePrivacyMode } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { maskNumericValue } from "@/lib/privacy/mask";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import { formatProjectionExpenseAmount } from "@/lib/currency/expense-display";
import { ExpenseAmount } from "@/components/expenses/expense-amount";
import type { ProjectionRow } from "@/lib/projections/build-projection";
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
  const { privacyMode } = usePrivacyMode();
  const [expandedPayDate, setExpandedPayDate] = useState<string | null>(null);

  function toggleRow(payDate: string) {
    setExpandedPayDate((current) => (current === payDate ? null : payDate));
  }

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
        <span>pay date</span>
        <span className="text-right">income</span>
        <span className="text-right">planned spend</span>
        <span className="text-right">free</span>
        <span className="text-right">cumulative</span>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row) => {
          const isExpanded = expandedPayDate === row.payDate;

          return (
            <div key={row.payDate}>
              <button
                type="button"
                onClick={() => toggleRow(row.payDate)}
                className="grid w-full grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 text-left transition-colors hover:bg-surface/60"
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
                    <Badge variant={row.isPast ? "default" : "accent"}>
                      {row.isPast ? "actual" : "projected"}
                    </Badge>
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

              {isExpanded && (
                <div className="border-t border-border/60 bg-bg/40 px-4 py-3 pl-10">
                  {row.expenseItems.length === 0 ? (
                    <p className="font-mono text-xs text-muted">
                      {"> no expenses in this period"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-mono text-xs text-muted">
                        expenses in period:
                      </p>
                      {row.expenseItems.map((item) => (
                        <div
                          key={`${item.name}-${item.date}`}
                          className="flex items-center justify-between font-mono text-xs"
                        >
                          <div>
                            <p className="text-text">{item.name}</p>
                            <p className="text-muted">
                              {formatDate(item.date)} {"//"}{" "}
                              {item.tags.length > 0
                                ? item.tags.join(", ")
                                : "untagged"}
                              {item.isSubscription ? " // subscription" : ""}
                              {item.projected ? " // projected" : " // actual"}
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
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
