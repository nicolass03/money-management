"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { MoneyText } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { IncomePaySchedule } from "@/lib/db/schema";
import { IncomeScheduleForm } from "./income-schedule-form";
import { IncomeScheduleList } from "./income-schedule-list";

interface PaySchedulesProps extends MoneyDisplayContext {
  schedules: IncomePaySchedule[];
}

export function PaySchedules({
  schedules,
  displayCurrency,
  rates,
}: PaySchedulesProps) {
  const [showAdd, setShowAdd] = useState(schedules.length === 0);
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
          title="pay_schedules"
          subtitle="configure pay dates and periodicity"
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-3">
          {schedules.length > 0 && (
            <Badge variant="accent">
              <MoneyText
                value={formatMoney(
                  perCycleTotal,
                  displayCurrency,
                  displayCurrency,
                  rates,
                )}
              />
              /cycle
            </Badge>
          )}
          <Button
            size="sm"
            variant={showAdd ? "ghost" : "primary"}
            onClick={() => setShowAdd((open) => !open)}
          >
            {showAdd ? "cancel" : "+ add schedule"}
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="mb-4">
          <p className="mb-4 font-mono text-xs text-muted">
            set an anchor pay date — future pay dates are derived from it
          </p>
          <IncomeScheduleForm
            displayCurrency={displayCurrency}
            rates={rates}
            onCancel={
              schedules.length > 0 ? () => setShowAdd(false) : undefined
            }
            onSuccess={() => setShowAdd(false)}
          />
        </Card>
      )}

      <IncomeScheduleList
        schedules={schedules}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </section>
  );
}
