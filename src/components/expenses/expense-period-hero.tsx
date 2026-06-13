import { Card } from "@/components/ui/card";
import { usePrivacyMode } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { ExpensePeriodView } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

interface ExpensePeriodHeroProps extends MoneyDisplayContext {
  periodView: ExpensePeriodView;
}

export function ExpensePeriodHero({
  periodView,
  displayCurrency,
  rates,
}: ExpensePeriodHeroProps) {
  const { privacyMode } = usePrivacyMode();
  const mask = privacyMode ? "••••" : undefined;

  const extraSpend = periodView.extraSpend ?? 0;
  const limitConverted = periodView.extraSpendLimitConverted;
  const isOverLimit =
    limitConverted != null && extraSpend > limitConverted;

  const formatDisplay = (amount: number) =>
    mask ?? formatMoney(amount, displayCurrency, displayCurrency, rates);

  return (
    <div className="mb-4 space-y-4">
      <Card>
        <div className="space-y-2">
          <p className="font-mono text-xs text-muted">{"> total spent"}</p>
          <p className="font-mono text-3xl font-medium text-text">
            {formatDisplay(periodView.totalSpend)}
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="space-y-1">
            <p className="font-mono text-xs text-muted">{"> extra spent"}</p>
            <p
              className={cn(
                "font-mono text-xl font-medium",
                isOverLimit ? "text-danger" : "text-text",
              )}
            >
              {formatDisplay(extraSpend)}
            </p>
            {limitConverted != null && (
              <p className="font-mono text-xs text-muted">
                {`> limit ${formatDisplay(limitConverted)}`}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-1">
            <p className="font-mono text-xs text-muted">{"> planned used"}</p>
            <p className="font-mono text-xl font-medium text-text">
              {periodView.plannedUsedPercent != null
                ? `${periodView.plannedUsedPercent}%`
                : "—"}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
