import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/ui/section-header";
import { useReportSummary } from "@/hooks/use-queries";
import {
  presetToRange,
  validateReportRange,
  type ReportDatePreset,
  type ReportDateRange,
} from "@/lib/reports/date-range";
import { ReportCharts } from "./report-charts";
import { ReportDateRangePicker } from "./report-date-range-picker";
import { ReportKpiGrid } from "./report-kpi-grid";
import { ReportLoadingSkeleton } from "./report-loading-skeletons";

interface ReportsDashboardProps {
  range: ReportDateRange;
  onRangeChange: (range: ReportDateRange) => void;
}

export function ReportsDashboard({ range, onRangeChange }: ReportsDashboardProps) {
  const { t } = useTranslation("reports");

  const validationError = useMemo(
    () => validateReportRange(range.from, range.to),
    [range.from, range.to],
  );

  const reportQuery = useReportSummary(
    range.from,
    range.to,
    validationError === null,
  );

  function applyPreset(preset: ReportDatePreset) {
    onRangeChange(presetToRange(preset));
  }

  return (
    <div>
      <SectionHeader title={t("title")} subtitle={t("subtitle")} className="mb-6" />

      <ReportDateRangePicker
        from={range.from}
        to={range.to}
        onFromChange={(from) => onRangeChange({ ...range, from })}
        onToChange={(to) => onRangeChange({ ...range, to })}
        onPreset={applyPreset}
        validationError={validationError}
      />

      {validationError === null && reportQuery.isLoading && (
        <ReportLoadingSkeleton />
      )}

      {validationError === null && reportQuery.isError && (
        <p className="font-mono text-sm text-danger">{t("loadError")}</p>
      )}

      {validationError === null && reportQuery.data && (
        <>
          <ReportKpiGrid
            kpis={reportQuery.data.kpis}
            priorPeriod={reportQuery.data.priorPeriod}
            dayCount={reportQuery.data.range.dayCount}
            displayCurrency={reportQuery.data.displayCurrency}
            rates={reportQuery.data.rates}
          />
          <ReportCharts
            report={reportQuery.data}
            displayCurrency={reportQuery.data.displayCurrency}
            rates={reportQuery.data.rates}
          />
        </>
      )}
    </div>
  );
}
