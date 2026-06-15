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
import type { RecurringExpenseWithTags } from "@/lib/types/domain";
import { RecurringExpenseForm } from "./recurring-expense-form";
import { RecurringExpenseList } from "./recurring-expense-list";
import { RecurringPaymentCharts } from "./recurring-payment-charts";

interface RecurringExpensesProps extends MoneyDisplayContext {
  recurringExpenses: RecurringExpenseWithTags[];
  allTags: string[];
}

export function RecurringExpenses({
  recurringExpenses,
  allTags,
  displayCurrency,
  rates,
}: RecurringExpensesProps) {
  const { t } = useTranslation(["expenses", "common"]);
  const [showAdd, setShowAdd] = useState(recurringExpenses.length === 0);
  const ctx = { displayCurrency, rates };

  const recurringTotal = recurringExpenses.reduce(
    (sum, recurring) =>
      sum + toDisplayAmount(recurring.amount, recurring.currency, ctx),
    0,
  );

  return (
    <section>
      <RecurringPaymentCharts
        recurringExpenses={recurringExpenses}
        allTags={allTags}
        displayCurrency={displayCurrency}
        rates={rates}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title={t("expenses:recurringTitle")}
          subtitle={t("expenses:recurringSubtitle")}
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-3">
          {recurringExpenses.length > 0 && (
            <Badge variant="accent">
              <MoneyText
                value={formatMoney(
                  recurringTotal,
                  displayCurrency,
                  displayCurrency,
                  rates,
                )}
              />
              {t("common:perCycle")}
            </Badge>
          )}
          <Button
            size="sm"
            variant={showAdd ? "ghost" : "primary"}
            onClick={() => setShowAdd((open) => !open)}
          >
            {showAdd ? t("common:cancel") : t("expenses:addRecurring")}
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="mb-4">
          <p className="mb-4 font-mono text-xs text-muted">
            {t("expenses:recurringFormHint")}
          </p>
          <RecurringExpenseForm
            displayCurrency={displayCurrency}
            rates={rates}
            onCancel={
              recurringExpenses.length > 0 ? () => setShowAdd(false) : undefined
            }
            onSuccess={() => setShowAdd(false)}
          />
        </Card>
      )}

      <RecurringExpenseList
        recurringExpenses={recurringExpenses}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </section>
  );
}
