import { useTranslation } from "react-i18next";
import { MoneyText } from "@/components/layout/privacy-mode";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Income } from "@/lib/types/domain";

interface IncomePlaceholderProps {
  entries: Income[];
}

export function IncomePlaceholder({ entries }: IncomePlaceholderProps) {
  const { t } = useTranslation("income");
  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <SectionHeader
          title={t("title")}
          subtitle={t("subtitlePlaceholder")}
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
            {t("emptyEntriesPlaceholder")}
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
