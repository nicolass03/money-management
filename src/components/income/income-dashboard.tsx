import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/ui/section-header";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { Income, IncomePaySchedule } from "@/lib/types/domain";
import { IncomeEntries } from "./income-entries";
import { PaySchedules } from "./pay-schedules";

interface IncomeDashboardProps extends MoneyDisplayContext {
  entries: Income[];
  schedules: IncomePaySchedule[];
  entriesLoading?: boolean;
  schedulesLoading?: boolean;
}

export function IncomeDashboard({
  entries,
  schedules,
  entriesLoading = false,
  schedulesLoading = false,
  displayCurrency,
  rates,
}: IncomeDashboardProps) {
  const { t } = useTranslation("income");

  // The all-time total is shown once, on the entries section header.
  return (
    <div>
      <SectionHeader title={t("title")} subtitle={t("subtitle")} className="mb-6" />

      <PaySchedules
        schedules={schedules}
        loading={schedulesLoading}
        displayCurrency={displayCurrency}
        rates={rates}
      />

      <IncomeEntries
        entries={entries}
        loading={entriesLoading}
        displayCurrency={displayCurrency}
        rates={rates}
      />
    </div>
  );
}
