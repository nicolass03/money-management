"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { usePrivacyMode } from "@/components/layout/privacy-mode";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import { maskNumericValue } from "@/lib/privacy/mask";
import type { ReportSummary, ReportTimeGranularity } from "@/lib/types/domain";
import { cn, formatDate } from "@/lib/utils";

interface ReportChartsProps extends MoneyDisplayContext {
  report: ReportSummary;
}

function granularityLabel(
  t: (key: string) => string,
  granularity: ReportTimeGranularity,
): string {
  switch (granularity) {
    case "day":
      return t("granularityDay");
    case "week":
      return t("granularityWeek");
    case "month":
      return t("granularityMonth");
  }
}

export function ReportCharts({
  report,
  displayCurrency,
  rates,
}: ReportChartsProps) {
  const { t } = useTranslation("reports");
  const { privacyMode } = usePrivacyMode();
  const chartTheme = useChartTheme();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const minorDivisor = displayCurrency === "cop" ? 1 : 100;

  function formatChartValue(value: number) {
    const formatted = formatMoney(
      Math.round(value * minorDivisor),
      displayCurrency,
      displayCurrency,
      rates,
    );
    return privacyMode ? maskNumericValue(formatted) : formatted;
  }

  const timeSeriesData = useMemo(
    () =>
      report.timeSeries.buckets.map((bucket) => ({
        label: bucket.label,
        income: bucket.income / minorDivisor,
        expenses: bucket.expenses / minorDivisor,
        net: bucket.net / minorDivisor,
      })),
    [report.timeSeries.buckets, minorDivisor],
  );

  const extraSpentTimeSeriesData = useMemo(
    () =>
      report.extraSpentTimeSeries.buckets.map((bucket) => ({
        label: formatDate(bucket.payDate),
        extraSpent: bucket.extraSpent / minorDivisor,
      })),
    [report.extraSpentTimeSeries.buckets, minorDivisor],
  );

  const tagData = useMemo(
    () =>
      report.byTag
        .filter(
          (entry) =>
            selectedTags.length === 0 || selectedTags.includes(entry.tag),
        )
        .map((entry) => ({
          tag: entry.tag,
          amount: entry.amount / minorDivisor,
        })),
    [report.byTag, selectedTags, minorDivisor],
  );

  const extraSpentByTagData = useMemo(
    () =>
      report.extraSpentByTag.map((entry) => ({
        tag: entry.tag,
        amount: entry.amount / minorDivisor,
      })),
    [report.extraSpentByTag, minorDivisor],
  );

  const subscriptionData = useMemo(
    () => [
      {
        name: t("seriesSubscription"),
        value: report.subscriptionSplit.subscription / minorDivisor,
      },
      {
        name: t("seriesOther"),
        value: report.subscriptionSplit.other / minorDivisor,
      },
    ],
    [report.subscriptionSplit, minorDivisor, t],
  );

  const allTags = report.byTag.map((entry) => entry.tag);
  const hasSubscriptionData =
    report.subscriptionSplit.subscription > 0 ||
    report.subscriptionSplit.other > 0;
  const hasExtraSpentData = extraSpentTimeSeriesData.some(
    (bucket) => bucket.extraSpent > 0,
  );
  const hasExtraSpentByTagData = extraSpentByTagData.length > 0;
  const hasAnyData =
    report.kpis.expenseCount > 0 || report.kpis.incomeCount > 0;

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  const axisTick = {
    fill: chartTheme.tick,
    fontSize: 11,
    fontFamily: "monospace",
  };

  if (!hasAnyData) {
    return (
      <Card>
        <p className="font-mono text-sm text-muted">{t("noData")}</p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <SectionHeader
            title={t("chartIncomeVsExpenses")}
            subtitle={t("chartIncomeVsExpensesSubtitle", {
              granularity: granularityLabel(
                t,
                report.timeSeries.granularity,
              ),
            })}
            className="mb-3"
          />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timeSeriesData}>
              <XAxis
                dataKey="label"
                tick={axisTick}
                axisLine={{ stroke: chartTheme.axis }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={axisTick}
                axisLine={{ stroke: chartTheme.axis }}
                tickLine={false}
                tickFormatter={(value) =>
                  privacyMode ? maskNumericValue(String(value)) : String(value)
                }
              />
              <Tooltip
                contentStyle={{
                  background: chartTheme.tooltipBg,
                  border: `1px solid ${chartTheme.tooltipBorder}`,
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
                formatter={(value) => formatChartValue(Number(value))}
              />
              <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: 11 }} />
              <Bar
                dataKey="income"
                name={t("seriesIncome")}
                fill={chartTheme.pieColors[0]}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name={t("seriesExpenses")}
                fill={chartTheme.barFill}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p className="mb-2 font-mono text-xs text-muted">{t("chartByTag")}</p>
          {allTags.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {allTags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="cursor-pointer"
                  >
                    <Badge
                      variant={active ? "accent" : "default"}
                      className={cn(!active && "opacity-70 hover:opacity-100")}
                    >
                      {tag}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tagData}>
              <XAxis
                dataKey="tag"
                tick={axisTick}
                axisLine={{ stroke: chartTheme.axis }}
                tickLine={false}
              />
              <YAxis
                tick={axisTick}
                axisLine={{ stroke: chartTheme.axis }}
                tickLine={false}
                tickFormatter={(value) =>
                  privacyMode ? maskNumericValue(String(value)) : String(value)
                }
              />
              <Tooltip
                contentStyle={{
                  background: chartTheme.tooltipBg,
                  border: `1px solid ${chartTheme.tooltipBorder}`,
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
                formatter={(value) => formatChartValue(Number(value))}
              />
              <Bar
                dataKey="amount"
                fill={chartTheme.barFill}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p className="mb-2 font-mono text-xs text-muted">
            {t("chartSubscriptionSplit")}
          </p>
          {hasSubscriptionData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) =>
                    privacyMode
                      ? name
                      : `${name}: ${formatChartValue(Number(value))}`
                  }
                >
                  {subscriptionData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={
                        chartTheme.pieColors[index % chartTheme.pieColors.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: chartTheme.tooltipBg,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                  formatter={(value) => formatChartValue(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="font-mono text-sm text-muted">{t("noData")}</p>
          )}
        </Card>

        <Card>
          <p className="mb-2 font-mono text-xs text-muted">
            {t("chartNetTrend")}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeSeriesData}>
              <XAxis
                dataKey="label"
                tick={axisTick}
                axisLine={{ stroke: chartTheme.axis }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={axisTick}
                axisLine={{ stroke: chartTheme.axis }}
                tickLine={false}
                tickFormatter={(value) =>
                  privacyMode ? maskNumericValue(String(value)) : String(value)
                }
              />
              <Tooltip
                contentStyle={{
                  background: chartTheme.tooltipBg,
                  border: `1px solid ${chartTheme.tooltipBorder}`,
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
                formatter={(value) => formatChartValue(Number(value))}
              />
              <Line
                type="monotone"
                dataKey="net"
                name={t("seriesNet")}
                stroke={chartTheme.pieColors[0]}
                strokeWidth={2}
                dot={{ fill: chartTheme.pieColors[0], r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionHeader
            title={t("chartExtraSpentTrend")}
            subtitle={t("chartExtraSpentTrendSubtitle")}
            className="mb-3"
          />
          {hasExtraSpentData ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={extraSpentTimeSeriesData}>
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  axisLine={{ stroke: chartTheme.axis }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={axisTick}
                  axisLine={{ stroke: chartTheme.axis }}
                  tickLine={false}
                  tickFormatter={(value) =>
                    privacyMode
                      ? maskNumericValue(String(value))
                      : String(value)
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: chartTheme.tooltipBg,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                  formatter={(value) => formatChartValue(Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey="extraSpent"
                  name={t("seriesExtraSpent")}
                  stroke={chartTheme.pieColors[2]}
                  strokeWidth={2}
                  dot={{ fill: chartTheme.pieColors[2], r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="font-mono text-sm text-muted">{t("noData")}</p>
          )}
        </Card>

        <Card>
          <p className="mb-2 font-mono text-xs text-muted">
            {t("chartExtraSpentByTag")}
          </p>
          {hasExtraSpentByTagData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={extraSpentByTagData}>
                <XAxis
                  dataKey="tag"
                  tick={axisTick}
                  axisLine={{ stroke: chartTheme.axis }}
                  tickLine={false}
                />
                <YAxis
                  tick={axisTick}
                  axisLine={{ stroke: chartTheme.axis }}
                  tickLine={false}
                  tickFormatter={(value) =>
                    privacyMode
                      ? maskNumericValue(String(value))
                      : String(value)
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: chartTheme.tooltipBg,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                  formatter={(value) => formatChartValue(Number(value))}
                />
                <Bar
                  dataKey="amount"
                  fill={chartTheme.pieColors[2]}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="font-mono text-sm text-muted">{t("noData")}</p>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
