import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { ExpenseWithTags } from "@/lib/db/schema";
import { TagList } from "./tag-input";
import { formatDate } from "@/lib/utils";

interface MonthlyExpensesProps extends MoneyDisplayContext {
  expenses: ExpenseWithTags[];
}

export function MonthlyExpenses({
  expenses,
  displayCurrency,
  rates,
}: MonthlyExpensesProps) {
  const ctx = { displayCurrency, rates };
  const total = expenses.reduce(
    (sum, e) => sum + toDisplayAmount(e.amount, e.currency, ctx),
    0,
  );

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <SectionHeader
          title="monthly_irl_expenses"
          subtitle="one-off real-world spending"
          className="mb-0"
        />
        <Badge variant="accent">
          {formatMoney(total, displayCurrency, displayCurrency, rates)}
        </Badge>
      </div>

      <Card>
        {expenses.length === 0 ? (
          <p className="font-mono text-sm text-muted">
            {"> no irl expenses yet."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-mono text-sm text-text">{expense.name}</p>
                  <p className="font-mono text-xs text-muted">
                    {formatDate(expense.date)} {"//"} <TagList tags={expense.tags} />
                  </p>
                </div>
                <span className="font-mono text-sm text-danger">
                  -
                  {formatMoney(
                    expense.amount,
                    expense.currency,
                    displayCurrency,
                    rates,
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
