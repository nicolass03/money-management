import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/currency/format";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { Saving } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

interface SavingsPlaceholderProps extends MoneyDisplayContext {
  entries: Saving[];
}

export function SavingsPlaceholder({
  entries,
  displayCurrency,
  rates,
}: SavingsPlaceholderProps) {
  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <SectionHeader
          title="savings"
          subtitle="track contributions and goals"
          className="mb-0"
        />
        {entries.length > 0 && (
          <Badge variant="accent">
            {formatMoney(total, displayCurrency, displayCurrency, rates)}
          </Badge>
        )}
      </div>

      <Card>
        {entries.length === 0 ? (
          <p className="font-mono text-sm text-muted">
            {"> no entries yet. run add-entry soon."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-mono text-sm text-text">{entry.name}</p>
                  <p className="font-mono text-xs text-muted">
                    {formatDate(entry.date)}
                    {entry.note ? ` // ${entry.note}` : ""}
                  </p>
                </div>
                <span className="font-mono text-sm text-accent-glow">
                  {formatMoney(
                    entry.amount,
                    displayCurrency,
                    displayCurrency,
                    rates,
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
