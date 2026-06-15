"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { MoneyText } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { PlannedExpenseWithTags } from "@/lib/types/domain";
import { PlannedExpenseForm } from "./planned-expense-form";
import { PlannedExpenseList } from "./planned-expense-list";

interface PlannedExpensesProps extends MoneyDisplayContext {
  plannedExpenses: PlannedExpenseWithTags[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PlannedExpenses({
  plannedExpenses,
  displayCurrency,
  rates,
}: PlannedExpensesProps) {
  const { t } = useTranslation(["expenses", "common"]);
  const [showAdd, setShowAdd] = useState(plannedExpenses.length === 0);
  const ctx = { displayCurrency, rates };
  const today = todayIso();

  const upcomingTotal = plannedExpenses
    .filter((planned) => planned.date > today)
    .reduce(
      (sum, planned) =>
        sum + toDisplayAmount(planned.amount, planned.currency, ctx),
      0,
    );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title={t("expenses:plannedTitle")}
          subtitle={t("expenses:plannedSubtitle")}
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-3">
          {upcomingTotal > 0 && (
            <Badge variant="accent">
              <MoneyText
                value={formatMoney(
                  upcomingTotal,
                  displayCurrency,
                  displayCurrency,
                  rates,
                )}
              />
              {t("expenses:badgeUpcoming")}
            </Badge>
          )}
          <Button
            size="sm"
            variant={showAdd ? "ghost" : "primary"}
            onClick={() => setShowAdd((open) => !open)}
          >
            {showAdd ? t("common:cancel") : t("expenses:addPlanned")}
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="mb-4">
          <p className="mb-4 font-mono text-xs text-muted">
            {t("expenses:plannedFormHint")}
          </p>
          <PlannedExpenseForm
            displayCurrency={displayCurrency}
            rates={rates}
            onCancel={
              plannedExpenses.length > 0 ? () => setShowAdd(false) : undefined
            }
            onSuccess={() => setShowAdd(false)}
          />
        </Card>
      )}

      <PlannedExpenseList
        plannedExpenses={plannedExpenses}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </section>
  );
}
