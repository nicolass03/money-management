"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { MoneyText, usePrivacyMode } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { RecurringExpenseWithTags } from "@/lib/db/schema";
import {
  isActiveRecurring,
  toMonthlyDisplayAmount,
} from "@/lib/expenses/recurring-monthly";
import { maskNumericValue } from "@/lib/privacy/mask";
import { cn } from "@/lib/utils";

interface RecurringPaymentChartsProps extends MoneyDisplayContext {
  recurringExpenses: RecurringExpenseWithTags[];
  allTags: string[];
}

const DEBTS_TAG = "debts";

function recurringMatchesTags(
  recurring: RecurringExpenseWithTags,
  selectedTags: string[],
) {
  if (selectedTags.length === 0) {
    return true;
  }

  return recurring.tags.some((tag) => selectedTags.includes(tag));
}

function groupByTags(
  recurringExpenses: RecurringExpenseWithTags[],
  ctx: MoneyDisplayContext,
) {
  const map = new Map<string, number>();

  for (const recurring of recurringExpenses) {
    const monthlyAmount = toMonthlyDisplayAmount(recurring, ctx);
    for (const tag of recurring.tags) {
      map.set(tag, (map.get(tag) ?? 0) + monthlyAmount);
    }
  }

  return Array.from(map.entries())
    .map(([tag, amount]) => ({
      tag,
      amount: amount / (ctx.displayCurrency === "cop" ? 1 : 100),
    }))
    .sort((a, b) => b.amount - a.amount);
}

function sumMonthlyBy(
  recurringExpenses: RecurringExpenseWithTags[],
  ctx: MoneyDisplayContext,
  predicate: (recurring: RecurringExpenseWithTags) => boolean,
) {
  return recurringExpenses
    .filter(predicate)
    .reduce(
      (sum, recurring) => sum + toMonthlyDisplayAmount(recurring, ctx),
      0,
    );
}

function KpiCard({
  label,
  amountMinor,
  displayCurrency,
  rates,
  className,
}: {
  label: string;
  amountMinor: number;
  displayCurrency: MoneyDisplayContext["displayCurrency"];
  rates: MoneyDisplayContext["rates"];
  className?: string;
}) {
  return (
    <Card className={cn("animate-glow-pulse", className)}>
      <p className="mb-2 font-mono text-xs text-muted">{label}</p>
      <p className="font-mono text-2xl text-text">
        <MoneyText
          value={formatMoney(
            amountMinor,
            displayCurrency,
            displayCurrency,
            rates,
          )}
        />
        <span className="text-sm text-muted">/mo</span>
      </p>
    </Card>
  );
}

export function RecurringPaymentCharts({
  recurringExpenses,
  allTags,
  displayCurrency,
  rates,
}: RecurringPaymentChartsProps) {
  const { privacyMode } = usePrivacyMode();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const ctx = { displayCurrency, rates };
  const today = new Date().toISOString().slice(0, 10);

  const activeRecurring = useMemo(
    () => recurringExpenses.filter((recurring) => isActiveRecurring(recurring, today)),
    [recurringExpenses, today],
  );

  const filteredRecurring = useMemo(
    () =>
      activeRecurring.filter((recurring) =>
        recurringMatchesTags(recurring, selectedTags),
      ),
    [activeRecurring, selectedTags],
  );

  const tagData = useMemo(
    () => groupByTags(filteredRecurring, ctx),
    [filteredRecurring, displayCurrency, rates],
  );

  const subscriptionsMonthly = useMemo(
    () =>
      sumMonthlyBy(filteredRecurring, ctx, (recurring) => recurring.isSubscription),
    [filteredRecurring, displayCurrency, rates],
  );

  const debtsMonthly = useMemo(
    () =>
      sumMonthlyBy(filteredRecurring, ctx, (recurring) =>
        recurring.tags.includes(DEBTS_TAG),
      ),
    [filteredRecurring, displayCurrency, rates],
  );

  const total = filteredRecurring.reduce(
    (sum, recurring) => sum + toMonthlyDisplayAmount(recurring, ctx),
    0,
  );

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

  if (activeRecurring.length === 0) {
    return (
      <Card className="mb-4">
        <p className="font-mono text-sm text-muted">
          {"> no recurring payments yet."}
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      className="mb-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <SectionHeader
        title="monthly_distribution"
        subtitle={`total: ${formatChartValue(total / minorDivisor)}/mo // ${selectedTags.length > 0 ? `filtered by ${selectedTags.length} tag(s)` : "all recurring"}`}
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

      <div className="grid gap-4 md:grid-cols-3 md:items-stretch">
        <div className="flex h-full flex-col gap-4 md:col-span-1">
          <KpiCard
            label="subscriptions"
            amountMinor={subscriptionsMonthly}
            displayCurrency={displayCurrency}
            rates={rates}
            className="flex flex-1 flex-col justify-center"
          />
          <KpiCard
            label="debts"
            amountMinor={debtsMonthly}
            displayCurrency={displayCurrency}
            rates={rates}
            className="flex flex-1 flex-col justify-center"
          />
        </div>

        <Card className="flex h-full flex-col md:col-span-2">
          <p className="mb-2 font-mono text-xs text-muted">by_tag</p>
          <div className="min-h-[180px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tagData}>
              <XAxis
                dataKey="tag"
                tick={{ fill: "#6b6b6b", fontSize: 11, fontFamily: "monospace" }}
                axisLine={{ stroke: "#2a2a2a" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b6b6b", fontSize: 11, fontFamily: "monospace" }}
                axisLine={{ stroke: "#2a2a2a" }}
                tickLine={false}
                tickFormatter={(value) =>
                  privacyMode ? maskNumericValue(String(value)) : String(value)
                }
              />
              <Tooltip
                contentStyle={{
                  background: "#141414",
                  border: "1px solid #2a2a2a",
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
                formatter={(value) => formatChartValue(Number(value))}
              />
              <Bar dataKey="amount" fill="#d4d4d4" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
