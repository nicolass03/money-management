"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteSchedule } from "@/lib/actions/income-schedules";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { IncomePaySchedule } from "@/lib/db/schema";
import {
  formatFrequency,
  getUpcomingPayDates,
  scheduleToInput,
} from "@/lib/income/pay-periods";
import { formatDate } from "@/lib/utils";
import { IncomeScheduleForm } from "./income-schedule-form";

interface IncomeScheduleListProps extends MoneyDisplayContext {
  schedules: IncomePaySchedule[];
}

export function IncomeScheduleList({
  schedules,
  displayCurrency,
  rates,
}: IncomeScheduleListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteSchedule(id);
      if (editingId === id) {
        setEditingId(null);
      }
    });
  }

  if (schedules.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        {"> no pay schedules yet. add one above."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => {
        const upcoming = getUpcomingPayDates(scheduleToInput(schedule), 4);

        if (editingId === schedule.id) {
          return (
            <Card key={schedule.id}>
              <IncomeScheduleForm
                schedule={schedule}
                displayCurrency={displayCurrency}
                rates={rates}
                onCancel={() => setEditingId(null)}
                onSuccess={() => setEditingId(null)}
              />
            </Card>
          );
        }

        return (
          <Card key={schedule.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-text">{schedule.name}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  anchor {formatDate(schedule.anchorDate)} {"//"}{" "}
                  {formatFrequency(schedule.frequency)} {"//"}{" "}
                  {schedule.currency.toUpperCase()}
                </p>
              </div>
              <Badge variant="accent">
                {formatMoney(
                  schedule.amount,
                  schedule.currency,
                  displayCurrency,
                  rates,
                )}
              </Badge>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <p className="font-mono text-xs text-muted">next pay dates:</p>
              <ul className="mt-2 space-y-1">
                {upcoming.map((date) => (
                  <li
                    key={date}
                    className="flex items-center justify-between font-mono text-xs text-text"
                  >
                    <span>{formatDate(date)}</span>
                    <span className="text-success">
                      {formatMoney(
                        schedule.amount,
                        schedule.currency,
                        displayCurrency,
                        rates,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingId(schedule.id)}
              >
                edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={pending}
                onClick={() => handleDelete(schedule.id)}
              >
                {pending ? "deleting..." : "delete"}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
