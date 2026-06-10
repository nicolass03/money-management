import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { PaySchedules } from "./pay-schedules";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { Income, IncomePaySchedule } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

interface IncomeDashboardProps extends MoneyDisplayContext {
  entries: Income[];
  schedules: IncomePaySchedule[];
}

function sumEntries(
  entries: Income[],
  ctx: MoneyDisplayContext,
): number {
  return entries.reduce(
    (sum, entry) =>
      sum + toDisplayAmount(entry.amount, entry.currency, ctx),
    0,
  );
}

export function IncomeDashboard({
  entries,
  schedules,
  displayCurrency,
  rates,
}: IncomeDashboardProps) {
  const ctx = { displayCurrency, rates };
  const unassigned = entries.filter((entry) => entry.scheduleId == null);
  const total = sumEntries(entries, ctx);

  function formatDisplay(amount: number) {
    return formatMoney(amount, displayCurrency, displayCurrency, rates);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <SectionHeader
          title="income"
          subtitle="manage pay schedules and track earnings"
          className="mb-0"
        />
        {entries.length > 0 && (
          <Badge variant="success">{formatDisplay(total)}</Badge>
        )}
      </div>

      <PaySchedules
        schedules={schedules}
        displayCurrency={displayCurrency}
        rates={rates}
      />

      {unassigned.length > 0 && (
        <div className="mt-8 space-y-4">
          <SectionHeader
            title="unassigned"
            subtitle="entries not linked to a pay schedule"
          />
          <Card>
            <div className="divide-y divide-border">
              {unassigned.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-mono text-sm text-text">{entry.name}</p>
                    <p className="font-mono text-xs text-muted">
                      {formatDate(entry.date)} {"//"} {entry.source}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-success">
                    +{formatMoney(
                      entry.amount,
                      entry.currency,
                      displayCurrency,
                      rates,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
