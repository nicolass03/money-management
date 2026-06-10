import { MoneyText } from "@/components/layout/privacy-mode";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import { formatStoredExpenseAmount } from "@/lib/currency/expense-display";
import { ExpenseAmount } from "./expense-amount";
import type { ExpenseWithTags } from "@/lib/db/schema";
import { TagList } from "./tag-input";
import { formatDate } from "@/lib/utils";

interface SubscriptionsProps extends MoneyDisplayContext {
  subscriptions: ExpenseWithTags[];
}

export function Subscriptions({
  subscriptions,
  displayCurrency,
  rates,
}: SubscriptionsProps) {
  const ctx = { displayCurrency, rates };
  const total = subscriptions.reduce(
    (sum, s) => sum + toDisplayAmount(s.amount, s.currency, ctx),
    0,
  );

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <SectionHeader
          title="subscriptions"
          subtitle="recurring monthly charges"
          className="mb-0"
        />
        <Badge variant="accent">
          <MoneyText
            value={formatMoney(total, displayCurrency, displayCurrency, rates)}
          />
          /mo
        </Badge>
      </div>

      <Card>
        {subscriptions.length === 0 ? (
          <p className="font-mono text-sm text-muted">
            {"> no subscriptions yet."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-text">{sub.name}</p>
                    {sub.isSubscription && (
                      <Badge variant="default">subscription</Badge>
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted">
                    {formatDate(sub.date)} {"//"} <TagList tags={sub.tags} />
                  </p>
                </div>
                <ExpenseAmount
                  amount={formatStoredExpenseAmount(
                    sub.amount,
                    sub.currency,
                    displayCurrency,
                    rates,
                  )}
                  className="text-sm text-danger"
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
