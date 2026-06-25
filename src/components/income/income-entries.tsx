"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { MoneyText } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { Income } from "@/lib/types/domain";
import { localTodayIso } from "@/lib/date/local-today";
import { filterIncomeEntriesForDisplay } from "@/lib/income/filter-income-entries";
import { IncomeEntryList } from "./income-entry-list";
import { IncomeForm } from "./income-form";

interface IncomeEntriesProps extends MoneyDisplayContext {
  entries: Income[];
  loading?: boolean;
}

export function IncomeEntries({
  entries,
  loading = false,
  displayCurrency,
  rates,
}: IncomeEntriesProps) {
  const { t } = useTranslation(["income", "common"]);
  const [showAdd, setShowAdd] = useState(false);
  const ctx = { displayCurrency, rates };
  const today = localTodayIso();
  const visibleEntries = filterIncomeEntriesForDisplay(entries);

  const total = visibleEntries.reduce(
    (sum, entry) => sum + toDisplayAmount(entry.amount, entry.currency, ctx),
    0,
  );

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title={t("income:entriesTitle")}
          subtitle={t("income:entriesSubtitle")}
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-3">
          {loading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            visibleEntries.length > 0 && (
              <Badge variant="success">
                <MoneyText
                  value={formatMoney(total, displayCurrency, displayCurrency, rates)}
                />
              </Badge>
            )
          )}
          {!loading && (
            <Button
              size="sm"
              variant={showAdd ? "ghost" : "primary"}
              onClick={() => setShowAdd((open) => !open)}
            >
              {showAdd ? t("common:cancel") : t("income:addIncome")}
            </Button>
          )}
        </div>
      </div>

      {showAdd && !loading && (
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
        loading={loading}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </section>
  );
}
