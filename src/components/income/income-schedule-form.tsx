"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  createSchedule,
  updateSchedule,
  type ScheduleFormState,
} from "@/lib/actions/income-schedules";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import {
  currencies,
  payFrequencies,
  type CurrencyCode,
  type IncomePaySchedule,
  type PayFrequency,
} from "@/lib/db/schema";
import { formatFrequency, getUpcomingPayDates } from "@/lib/income/pay-periods";
import {
  formatCentsAsDollarsInput,
  formatDate,
  parseDollarsToCents,
} from "@/lib/utils";

const initialState: ScheduleFormState = {};

interface IncomeScheduleFormProps extends MoneyDisplayContext {
  schedule?: IncomePaySchedule;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function IncomeScheduleForm({
  schedule,
  onCancel,
  onSuccess,
  displayCurrency,
  rates,
}: IncomeScheduleFormProps) {
  const isEditing = Boolean(schedule);
  const [name, setName] = useState(schedule?.name ?? "");
  const [anchorDate, setAnchorDate] = useState(schedule?.anchorDate ?? "");
  const [frequency, setFrequency] = useState<PayFrequency>(
    schedule?.frequency ?? "biweekly",
  );
  const [currency, setCurrency] = useState<CurrencyCode>(
    schedule?.currency ?? "usd",
  );
  const [amount, setAmount] = useState(
    schedule ? formatCentsAsDollarsInput(schedule.amount) : "",
  );

  const action = isEditing
    ? updateSchedule.bind(null, schedule!.id)
    : createSchedule;

  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  const previewDates =
    anchorDate && payFrequencies.includes(frequency)
      ? getUpcomingPayDates({ anchorDate, frequency }, 4)
      : [];
  const previewAmount = parseDollarsToCents(amount);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="schedule-name"
          className="mb-2 block font-mono text-xs text-muted"
        >
          name:
        </label>
        <Input
          id="schedule-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Salary"
          required
        />
      </div>

      <div>
        <label
          htmlFor="schedule-anchor"
          className="mb-2 block font-mono text-xs text-muted"
        >
          pay_anchor:
        </label>
        <Input
          id="schedule-anchor"
          name="anchorDate"
          type="date"
          value={anchorDate}
          onChange={(e) => setAnchorDate(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="schedule-amount"
            className="mb-2 block font-mono text-xs text-muted"
          >
            amount_per_pay:
          </label>
          <Input
            id="schedule-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="4500.00"
            required
          />
        </div>

        <div>
          <label
            htmlFor="schedule-currency"
            className="mb-2 block font-mono text-xs text-muted"
          >
            currency:
          </label>
          <select
            id="schedule-currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className={cn(
              "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent focus:shadow-[0_0_8px_rgba(255,255,255,0.1)]",
            )}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="schedule-frequency"
          className="mb-2 block font-mono text-xs text-muted"
        >
          frequency:
        </label>
        <select
          id="schedule-frequency"
          name="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as PayFrequency)}
          className={cn(
            "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent focus:shadow-[0_0_8px_rgba(255,255,255,0.1)]",
          )}
        >
          <option value="biweekly">every 2 weeks</option>
          <option value="monthly">monthly</option>
        </select>
      </div>

      {previewDates.length > 0 && (
        <div className="rounded border border-border/60 bg-bg/50 px-3 py-2">
          <p className="font-mono text-xs text-muted">upcoming pay dates:</p>
          <ul className="mt-2 space-y-1">
            {previewDates.map((date) => (
              <li
                key={date}
                className="flex items-center justify-between font-mono text-xs text-text"
              >
                <span>
                  {formatDate(date)} {"//"} {formatFrequency(frequency)}
                </span>
                <span className="text-success">
                  {previewAmount !== null
                    ? formatMoney(
                        previewAmount,
                        currency,
                        displayCurrency,
                        rates,
                      )
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.error && (
        <p className="font-mono text-xs text-danger">{state.error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "saving..." : isEditing ? "update" : "add schedule"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            cancel
          </Button>
        )}
      </div>
    </form>
  );
}
