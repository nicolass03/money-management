"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
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
import { maskNumericValue } from "@/lib/privacy/mask";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { ExpenseChartSummary } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

interface ExpenseChartsProps extends MoneyDisplayContext {
  summary: ExpenseChartSummary;
}

export function ExpenseCharts({
  summary,
  displayCurrency,
  rates,
}: ExpenseChartsProps) {
  const { privacyMode } = usePrivacyMode();
  const chartTheme = useChartTheme();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(
    () => summary.byTag.map((entry) => entry.tag),
    [summary.byTag],
  );

  const tagData = useMemo(() => {
    const minorDivisor = displayCurrency === "cop" ? 1 : 100;
    return summary.byTag
      .filter(
        (entry) =>
          selectedTags.length === 0 || selectedTags.includes(entry.tag),
      )
      .map((entry) => ({
        tag: entry.tag,
        amount: entry.amount / minorDivisor,
      }));
  }, [summary.byTag, selectedTags, displayCurrency]);

  const typeData = useMemo(() => {
    const minorDivisor = displayCurrency === "cop" ? 1 : 100;
    const { subscription, other } = summary.subscriptionSplit;
    return [
      { name: "subscriptions", value: subscription / minorDivisor },
      { name: "other", value: other / minorDivisor },
    ];
  }, [summary.subscriptionSplit, displayCurrency]);

  const total = tagData.reduce((sum, entry) => sum + entry.amount, 0);

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

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <SectionHeader
        title="expense_analytics"
        subtitle={`total: ${formatChartValue(total)} // ${selectedTags.length > 0 ? `filtered by ${selectedTags.length} tag(s)` : "all expenses"}`}
      />

      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted">filter:</span>
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
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="font-mono text-xs text-accent hover:text-accent-glow"
            >
              clear
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1 animate-glow-pulse">
          <p className="mb-2 font-mono text-xs text-muted">by_type</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={typeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                stroke="none"
              >
                {typeData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={chartTheme.pieColors[index % chartTheme.pieColors.length]}
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
        </Card>

        <Card className="md:col-span-2">
          <p className="mb-2 font-mono text-xs text-muted">by_tag</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tagData}>
              <XAxis
                dataKey="tag"
                tick={{
                  fill: chartTheme.tick,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
                axisLine={{ stroke: chartTheme.axis }}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: chartTheme.tick,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
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
      </div>
    </motion.div>
  );
}
