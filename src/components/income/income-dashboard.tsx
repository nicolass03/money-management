import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { MoneyText } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { Income, IncomePaySchedule } from "@/lib/types/domain";
import { IncomeEntries } from "./income-entries";
import { PaySchedules } from "./pay-schedules";

interface IncomeDashboardProps extends MoneyDisplayContext {
  entries: Income[];
  schedules: IncomePaySchedule[];
  entriesLoading?: boolean;
  schedulesLoading?: boolean;
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
  entriesLoading = false,
  schedulesLoading = false,
  displayCurrency,
  rates,
}: IncomeDashboardProps) {
  const ctx = { displayCurrency, rates };
  const total = sumEntries(entries, ctx);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <SectionHeader
          title="income"
          subtitle="manage pay schedules and track earnings"
          className="mb-0"
        />
        {entriesLoading ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          entries.length > 0 && (
            <Badge variant="success">
              <MoneyText
                value={formatMoney(total, displayCurrency, displayCurrency, rates)}
              />
            </Badge>
          )
        )}
      </div>

      <PaySchedules
        schedules={schedules}
        loading={schedulesLoading}
        displayCurrency={displayCurrency}
        rates={rates}
      />

      <IncomeEntries
        entries={entries}
        schedules={schedules}
        loading={entriesLoading}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </div>
  );
}
