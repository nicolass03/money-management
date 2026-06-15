"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardListSkeleton } from "@/components/ui/list-skeletons";
import { MoneyText } from "@/components/layout/privacy-mode";
import { useDeleteSchedule } from "@/lib/mutations/income-schedules";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { IncomePaySchedule } from "@/lib/types/domain";
import {
  formatFrequency,
  getUpcomingPayDates,
  scheduleToInput,
} from "@/lib/income/pay-periods";
import { formatDate } from "@/lib/utils";
import { IncomeScheduleForm } from "./income-schedule-form";

interface IncomeScheduleListProps extends MoneyDisplayContext {
  schedules: IncomePaySchedule[];
  loading?: boolean;
}

export function IncomeScheduleList({
  schedules,
  loading = false,
  displayCurrency,
  rates,
}: IncomeScheduleListProps) {
  const { t } = useTranslation(["income", "common"]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const deleteScheduleMutation = useDeleteSchedule();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteScheduleMutation.mutateAsync(id);
      if (editingId === id) {
        setEditingId(null);
      }
    });
  }

  if (loading) {
    return <CardListSkeleton count={2} label={t("income:loadingPaySchedules")} />;
  }

  if (schedules.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        {t("income:emptySchedules")}
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
                  {t("income:metaAnchor", { date: formatDate(schedule.anchorDate) })}{" "}
                  {"//"} {formatFrequency(schedule.frequency)} {"//"}{" "}
                  {schedule.currency.toUpperCase()}
                </p>
              </div>
              <Badge variant="accent">
                <MoneyText
                  value={formatMoney(
                    schedule.amount,
                    schedule.currency,
                    displayCurrency,
                    rates,
                  )}
                />
              </Badge>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <p className="font-mono text-xs text-muted">{t("income:nextPayDates")}</p>
              <ul className="mt-2 space-y-1">
                {upcoming.map((date) => (
                  <li
                    key={date}
                    className="flex items-center justify-between font-mono text-xs text-text"
                  >
                    <span>{formatDate(date)}</span>
                    <MoneyText
                      className="text-success"
                      value={formatMoney(
                        schedule.amount,
                        schedule.currency,
                        displayCurrency,
                        rates,
                      )}
                    />
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
                {t("common:edit")}
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={pending}
                onClick={() => handleDelete(schedule.id)}
              >
                {pending ? t("common:deleting") : t("common:delete")}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
