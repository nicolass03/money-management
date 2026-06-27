"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportDatePreset } from "@/lib/reports/date-range";
import { cn } from "@/lib/utils";

interface ReportDateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onPreset: (preset: ReportDatePreset) => void;
  validationError: string | null;
}

const PRESETS: { key: ReportDatePreset; labelKey: string }[] = [
  { key: "last-30", labelKey: "presetLast30" },
  { key: "last-3-months", labelKey: "presetLast3Months" },
  { key: "last-6-months", labelKey: "presetLast6Months" },
  { key: "ytd", labelKey: "presetYtd" },
];

export function ReportDateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  onPreset,
  validationError,
}: ReportDateRangePickerProps) {
  const { t } = useTranslation(["reports", "common"]);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs text-muted">{t("fromLabel")}</span>
          <Input
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="w-40"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-xs text-muted">{t("toLabel")}</span>
          <Input
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="w-40"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.key}
            size="sm"
            variant="ghost"
            onClick={() => onPreset(preset.key)}
          >
            {t(preset.labelKey)}
          </Button>
        ))}
      </div>

      {validationError && (
        <p className={cn("font-mono text-xs text-danger")}>
          {t(validationError)}
        </p>
      )}
    </div>
  );
}
