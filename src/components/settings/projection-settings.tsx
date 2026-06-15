import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { useUpdateProjectionSettings } from "@/lib/mutations/settings";
import { CURRENCY_LABELS } from "@/lib/currency/types";
import type { CurrencyCode, IncomePaySchedule } from "@/lib/types/domain";
import { formatFrequency } from "@/lib/income/pay-periods";
import { cn, formatCentsAsDollarsInput } from "@/lib/utils";

interface ProjectionSettingsProps {
  schedules: IncomePaySchedule[];
  primaryScheduleId: string | null;
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
  const { t } = useTranslation(["settings", "common"]);
  const updateSettings = useUpdateProjectionSettings();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    const result = await updateSettings.mutateAsync({
      primaryScheduleId: String(formData.get("primaryScheduleId") ?? ""),
      initialFreeMoney: String(formData.get("initialFreeMoney") ?? ""),
      projectionStartDate: String(formData.get("projectionStartDate") ?? ""),
    });
    if (result.success) setSuccess(true);
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("settings:projectionsTitle")}
        subtitle={t("settings:projectionsSubtitle")}
      />

      <Card>
        {schedules.length === 0 ? (
          <p className="font-mono text-sm text-muted">
            {t("settings:addScheduleFirstPrefix")}
            <Link to="/income" className="text-accent hover:text-accent-glow">
              ~/income
            </Link>
            {t("settings:addScheduleFirstSuffix")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="primary-schedule"
                className="mb-2 block font-mono text-xs text-muted"
              >
                {t("settings:primarySchedule")}
              </label>
              <select
                id="primary-schedule"
                name="primaryScheduleId"
                defaultValue={primaryScheduleId ?? ""}
                className={cn(
                  "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent",
                )}
              >
                <option value="">{t("settings:selectSchedule")}</option>
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
                {t("settings:projectionStartDate")}
              </label>
              <Input
                id="projection-start-date"
                name="projectionStartDate"
                type="date"
                defaultValue={projectionStartDate ?? ""}
              />
              <p className="mt-2 font-mono text-xs text-muted">
                {t("settings:projectionStartDateHint")}
              </p>
            </div>

            <div>
              <label
                htmlFor="initial-free-money"
                className="mb-2 block font-mono text-xs text-muted"
              >
                {t("settings:initialFreeMoney", { currency: CURRENCY_LABELS[displayCurrency] })}
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
                {t("settings:initialFreeMoneyHint")}
              </p>
            </div>

            {updateSettings.data?.error && (
              <p className="font-mono text-xs text-danger">
                {updateSettings.data.error}
              </p>
            )}
            {success && (
              <p className="font-mono text-xs text-success">
                {t("settings:projectionUpdated")}
              </p>
            )}

            <Button type="submit" loading={updateSettings.isPending}>
              {updateSettings.isPending ? t("common:saving") : t("settings:saveProjectionSettings")}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
