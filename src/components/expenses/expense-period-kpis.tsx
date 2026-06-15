import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { usePrivacyMode } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { maskNumericValue } from "@/lib/privacy/mask";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { ExpensePeriodView } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

// Limit usage thresholds: yellow once within 30% of the limit (>=70% used), red once within
// 8% of the limit or over it (>=92% used). Mirrors the iOS KPI thresholds.
const WARNING_RATIO = 0.7;
const DANGER_RATIO = 0.92;

interface ExpensePeriodKpisProps extends MoneyDisplayContext {
  periodView: ExpensePeriodView;
}

export function ExpensePeriodKpis({
  periodView,
  displayCurrency,
  rates,
}: ExpensePeriodKpisProps) {
  const { t } = useTranslation("expenses");
  const { privacyMode } = usePrivacyMode();

  function format(amountMinor: number) {
    const formatted = formatMoney(
      amountMinor,
      displayCurrency,
      displayCurrency,
      rates,
    );
    return privacyMode ? maskNumericValue(formatted) : formatted;
  }

  const { byTag, extraSpent, extraSpentLimit, isPayPeriod } = periodView;
  const actualSpend = byTag.reduce((sum, entry) => sum + entry.amount, 0);
  // The limit comparison only applies to the pay period; calendar ranges show extra spend alone.
  const showLimit = isPayPeriod && extraSpentLimit != null && extraSpentLimit > 0;
  const ratio = showLimit ? extraSpent / extraSpentLimit! : 0;

  const extraColor = !showLimit
    ? "text-text"
    : ratio >= DANGER_RATIO
      ? "text-danger"
      : ratio >= WARNING_RATIO
        ? "text-warning"
        : "text-text";

  return (
    <div className="flex h-full flex-col gap-4 md:col-span-1">
      <Card className="flex flex-1 flex-col justify-center animate-glow-pulse">
        <p className="mb-2 font-mono text-xs text-muted">{t("totalSpent")}</p>
        <p className="font-mono text-2xl text-text">{format(actualSpend)}</p>
      </Card>

      <Card className="flex flex-1 flex-col justify-center">
        <p className="mb-2 font-mono text-xs text-muted">{t("extraSpent")}</p>
        <div className="flex flex-wrap items-baseline gap-2">
          <p className={cn("font-mono text-2xl", extraColor)}>
            {format(extraSpent)}
          </p>
          {showLimit && (
            <p className="font-mono text-xs text-muted">
              {"/ "}
              {format(extraSpentLimit!)} {t("limitSuffix")}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
