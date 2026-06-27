"use client";

import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { usePrivacyMode } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { maskNumericValue } from "@/lib/privacy/mask";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import { formatPriorDelta } from "@/lib/reports/date-range";
import type { ReportKpis, ReportPriorPeriod } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

interface ReportKpiGridProps extends MoneyDisplayContext {
  kpis: ReportKpis;
  priorPeriod: ReportPriorPeriod | null;
  dayCount: number;
}

interface KpiCardProps {
  label: string;
  value: string;
  delta: { text: string; positive: boolean } | null;
  deltaLabel: string | null;
  valueClassName?: string;
}

function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  valueClassName,
}: KpiCardProps) {
  return (
    <Card>
      <p className="font-mono text-xs text-muted">{label}</p>
      <p className={cn("mt-1 text-2xl text-text", valueClassName)}>{value}</p>
      {delta && deltaLabel && (
        <p
          className={cn(
            "mt-1 font-mono text-xs",
            delta.positive ? "text-accent-glow" : "text-danger",
          )}
        >
          {delta.text} {deltaLabel}
        </p>
      )}
    </Card>
  );
}

export function ReportKpiGrid({
  kpis,
  priorPeriod,
  dayCount,
  displayCurrency,
  rates,
}: ReportKpiGridProps) {
  const { t } = useTranslation("reports");
  const { privacyMode } = usePrivacyMode();

  function format(amountMinor: number) {
    const formatted = formatMoney(
      amountMinor,
      displayCurrency,
      displayCurrency,
      rates,
    );
    return privacyMode ? maskNumericValue(formatted) : formatted;
  }

  const prior = priorPeriod?.kpis ?? null;
  const deltaLabel = prior
    ? t("vsPriorPeriod", { days: dayCount })
    : null;

  function deltaFor(
    current: number,
    priorValue: number | undefined,
  ): { text: string; positive: boolean } | null {
    if (priorValue === undefined) return null;
    return formatPriorDelta(current, priorValue);
  }

  const netColor =
    kpis.netCashFlow > 0
      ? "text-accent-glow"
      : kpis.netCashFlow < 0
        ? "text-danger"
        : "text-text";

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        label={t("kpiTotalIncome")}
        value={format(kpis.totalIncome)}
        delta={deltaFor(kpis.totalIncome, prior?.totalIncome)}
        deltaLabel={deltaLabel}
      />
      <KpiCard
        label={t("kpiTotalExpenses")}
        value={format(kpis.totalExpenses)}
        delta={deltaFor(kpis.totalExpenses, prior?.totalExpenses)}
        deltaLabel={deltaLabel}
        valueClassName={
          deltaFor(kpis.totalExpenses, prior?.totalExpenses)?.positive
            ? "text-danger"
            : undefined
        }
      />
      <KpiCard
        label={t("kpiNetCashFlow")}
        value={format(kpis.netCashFlow)}
        delta={deltaFor(kpis.netCashFlow, prior?.netCashFlow)}
        deltaLabel={deltaLabel}
        valueClassName={netColor}
      />
      <KpiCard
        label={t("kpiExtraSpent")}
        value={format(kpis.extraSpent)}
        delta={deltaFor(kpis.extraSpent, prior?.extraSpent)}
        deltaLabel={deltaLabel}
      />
      <KpiCard
        label={t("kpiAvgDailySpend")}
        value={format(kpis.avgDailySpend)}
        delta={deltaFor(kpis.avgDailySpend, prior?.avgDailySpend)}
        deltaLabel={deltaLabel}
      />
      <KpiCard
        label={t("kpiExpenseCount")}
        value={privacyMode ? "•••" : String(kpis.expenseCount)}
        delta={deltaFor(kpis.expenseCount, prior?.expenseCount)}
        deltaLabel={deltaLabel}
      />
    </div>
  );
}
