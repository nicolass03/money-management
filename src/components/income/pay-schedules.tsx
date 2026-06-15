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
import type { IncomePaySchedule } from "@/lib/types/domain";
import { IncomeScheduleForm } from "./income-schedule-form";
import { IncomeScheduleList } from "./income-schedule-list";

interface PaySchedulesProps extends MoneyDisplayContext {
  schedules: IncomePaySchedule[];
  loading?: boolean;
}

export function PaySchedules({
  schedules,
  loading = false,
  displayCurrency,
  rates,
}: PaySchedulesProps) {
  const { t } = useTranslation(["income", "common"]);
  const [showAdd, setShowAdd] = useState(false);
  const ctx = { displayCurrency, rates };

  const perCycleTotal = schedules.reduce(
    (sum, schedule) =>
      sum + toDisplayAmount(schedule.amount, schedule.currency, ctx),
    0,
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title={t("income:paySchedulesTitle")}
          subtitle={t("income:paySchedulesSubtitle")}
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-3">
          {loading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            schedules.length > 0 && (
              <Badge variant="accent">
                <MoneyText
                  value={formatMoney(
                    perCycleTotal,
                    displayCurrency,
                    displayCurrency,
                    rates,
                  )}
                />
                {t("common:perCycle")}
              </Badge>
            )
          )}
          {!loading && (
            <Button
              size="sm"
              variant={showAdd ? "ghost" : "primary"}
              onClick={() => setShowAdd((open) => !open)}
            >
              {showAdd ? t("common:cancel") : t("income:addSchedule")}
            </Button>
          )}
        </div>
      </div>

      {showAdd && !loading && (
        <Card className="mb-4">
          <p className="mb-4 font-mono text-xs text-muted">
            {t("income:scheduleFormHint")}
          </p>
          <IncomeScheduleForm
            displayCurrency={displayCurrency}
            rates={rates}
            onCancel={() => setShowAdd(false)}
            onSuccess={() => setShowAdd(false)}
          />
        </Card>
      )}

      <IncomeScheduleList
        schedules={schedules}
        loading={loading}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </section>
  );
}
