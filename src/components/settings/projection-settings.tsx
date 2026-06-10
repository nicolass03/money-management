"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import {
  updateProjectionSettings,
  type SettingsFormState,
} from "@/lib/actions/user-settings";
import { CURRENCY_LABELS } from "@/lib/currency/types";
import type { CurrencyCode, IncomePaySchedule } from "@/lib/db/schema";
import { formatFrequency } from "@/lib/income/pay-periods";
import { cn, formatCentsAsDollarsInput } from "@/lib/utils";

const initialState: SettingsFormState = {};

interface ProjectionSettingsProps {
  schedules: IncomePaySchedule[];
  primaryScheduleId: number | null;
  projectionInitialFreeMoney: number;
  projectionStartDate: string | null;
  displayCurrency: CurrencyCode;
}

export function ProjectionSettings({
  schedules,
  primaryScheduleId,
  projectionInitialFreeMoney,
  projectionStartDate,
  displayCurrency,
}: ProjectionSettingsProps) {
  const [state, formAction, pending] = useActionState(
    updateProjectionSettings,
    initialState,
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="projections"
        subtitle="choose pay periods, starting date, and opening free cash balance for projections"
      />

      <Card>
        {schedules.length === 0 ? (
          <p className="font-mono text-sm text-muted">
            {"> add an income pay schedule on "}
            <Link
              href="/income"
              className="text-accent hover:text-accent-glow"
            >
              ~/income
            </Link>
            {" first."}
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="primary-schedule"
                className="mb-2 block font-mono text-xs text-muted"
              >
                primary_schedule:
              </label>
              <select
                id="primary-schedule"
                name="primaryScheduleId"
                defaultValue={primaryScheduleId ?? ""}
                className={cn(
                  "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent",
                )}
              >
                <option value="">select a schedule</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.name} ({formatFrequency(schedule.frequency)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="projection-start-date"
                className="mb-2 block font-mono text-xs text-muted"
              >
                projection_start_date:
              </label>
              <Input
                id="projection-start-date"
                name="projectionStartDate"
                type="date"
                defaultValue={projectionStartDate ?? ""}
              />
              <p className="mt-2 font-mono text-xs text-muted">
                {"> only pay periods from this date onward are included"}
              </p>
            </div>

            <div>
              <label
                htmlFor="initial-free-money"
                className="mb-2 block font-mono text-xs text-muted"
              >
                initial_free_money ({CURRENCY_LABELS[displayCurrency]}):
              </label>
              <Input
                id="initial-free-money"
                name="initialFreeMoney"
                type="text"
                inputMode="decimal"
                defaultValue={formatCentsAsDollarsInput(projectionInitialFreeMoney)}
                placeholder="0.00"
              />
              <p className="mt-2 font-mono text-xs text-muted">
                {"> starting balance added to cumulative free money from the first pay period"}
              </p>
            </div>

            {state.error && (
              <p className="font-mono text-xs text-danger">{state.error}</p>
            )}
            {state.success && (
              <p className="font-mono text-xs text-success">
                {"> projection settings updated"}
              </p>
            )}

            <Button type="submit" disabled={pending}>
              {pending ? "saving..." : "save projection settings"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
