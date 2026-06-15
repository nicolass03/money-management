import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { useUpdateExtraSpentLimit } from "@/lib/mutations/settings";
import { CURRENCY_LABELS } from "@/lib/currency/types";
import type { CurrencyCode } from "@/lib/types/domain";
import { formatCentsAsDollarsInput } from "@/lib/utils";

interface ExtraSpentSettingsProps {
  extraSpentLimit: number | null;
  displayCurrency: CurrencyCode;
}

export function ExtraSpentSettings({
  extraSpentLimit,
  displayCurrency,
}: ExtraSpentSettingsProps) {
  const { t } = useTranslation(["settings", "common"]);
  const updateLimit = useUpdateExtraSpentLimit();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    const result = await updateLimit.mutateAsync(
      String(formData.get("extraSpentLimit") ?? ""),
    );
    if (result.success) setSuccess(true);
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("settings:extraSpentTitle")}
        subtitle={t("settings:extraSpentSubtitle")}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="extra-spent-limit"
              className="mb-2 block font-mono text-xs text-muted"
            >
              {t("settings:extraSpentLabel", { currency: CURRENCY_LABELS[displayCurrency] })}
            </label>
            <Input
              id="extra-spent-limit"
              name="extraSpentLimit"
              type="text"
              inputMode="decimal"
              defaultValue={
                extraSpentLimit != null
                  ? formatCentsAsDollarsInput(extraSpentLimit)
                  : ""
              }
              placeholder={t("settings:extraSpentPlaceholder")}
            />
            <p className="mt-2 font-mono text-xs text-muted">
              {t("settings:extraSpentHint")}
            </p>
          </div>

          {updateLimit.data?.error && (
            <p className="font-mono text-xs text-danger">
              {updateLimit.data.error}
            </p>
          )}
          {success && (
            <p className="font-mono text-xs text-success">
                {t("settings:extraSpentUpdated")}
            </p>
          )}

          <Button type="submit" loading={updateLimit.isPending}>
            {updateLimit.isPending ? t("common:saving") : t("settings:saveExtraSpentLimit")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
