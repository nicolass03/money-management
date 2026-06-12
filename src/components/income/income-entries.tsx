"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { MoneyText } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { Income, IncomePaySchedule } from "@/lib/types/domain";
import { filterIncomeEntriesForDisplay } from "@/lib/income/filter-income-entries";
import { IncomeEntryList } from "./income-entry-list";
import { IncomeForm } from "./income-form";

interface IncomeEntriesProps extends MoneyDisplayContext {
  entries: Income[];
  schedules: IncomePaySchedule[];
}

export function IncomeEntries({
  entries,
  schedules,
  displayCurrency,
  rates,
}: IncomeEntriesProps) {
  const [showAdd, setShowAdd] = useState(false);
  const ctx = { displayCurrency, rates };
  const today = new Date().toISOString().slice(0, 10);
  const visibleEntries = filterIncomeEntriesForDisplay(entries, schedules, today);

  const total = visibleEntries.reduce(
    (sum, entry) => sum + toDisplayAmount(entry.amount, entry.currency, ctx),
    0,
  );

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title="income_entries"
          subtitle="manual earnings and the next scheduled pay per pay schedule"
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-3">
          {visibleEntries.length > 0 && (
            <Badge variant="success">
              <MoneyText
                value={formatMoney(total, displayCurrency, displayCurrency, rates)}
              />
            </Badge>
          )}
          <Button
            size="sm"
            variant={showAdd ? "ghost" : "primary"}
            onClick={() => setShowAdd((open) => !open)}
          >
            {showAdd ? "cancel" : "+ add income"}
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="mb-4">
          <IncomeForm
            defaultDate={today}
            onCancel={() => setShowAdd(false)}
            onSuccess={() => setShowAdd(false)}
          />
        </Card>
      )}

      <IncomeEntryList
        entries={visibleEntries}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </section>
  );
}
