import { useState } from "react";
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
        title="extra_spent_limit"
        subtitle="optimal limit for unplanned spending (expenses not tied to recurring, planned, or budgets)"
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="extra-spent-limit"
              className="mb-2 block font-mono text-xs text-muted"
            >
              extra_spent_limit ({CURRENCY_LABELS[displayCurrency]}):
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
              placeholder="no limit"
            />
            <p className="mt-2 font-mono text-xs text-muted">
              {"> leave empty to remove the limit"}
            </p>
          </div>

          {updateLimit.data?.error && (
            <p className="font-mono text-xs text-danger">
              {updateLimit.data.error}
            </p>
          )}
          {success && (
            <p className="font-mono text-xs text-success">
              {"> extra spent limit updated"}
            </p>
          )}

          <Button type="submit" loading={updateLimit.isPending}>
            {updateLimit.isPending ? "saving..." : "save extra spent limit"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
