import { MoneyText } from "@/components/layout/privacy-mode";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Income } from "@/lib/db/schema";

interface IncomePlaceholderProps {
  entries: Income[];
}

export function IncomePlaceholder({ entries }: IncomePlaceholderProps) {
  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <SectionHeader
          title="income"
          subtitle="track earnings and sources"
          className="mb-0"
        />
        {entries.length > 0 && (
          <Badge variant="success">
            <MoneyText value={formatCurrency(total)} />
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
                    {formatDate(entry.date)} {"//"} {entry.source}
                  </p>
                </div>
                <span className="font-mono text-sm text-success">
                  +<MoneyText value={formatCurrency(entry.amount)} />
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
