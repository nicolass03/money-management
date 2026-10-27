import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgetExpenses } from "@/hooks/use-queries";
import { useRowDelete } from "@/hooks/use-row-delete";
import { useDeleteBudgetExpense } from "@/lib/mutations/budgets";
import { formatChargedExpenseAmount } from "@/lib/currency/expense-display";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { BudgetWithTags } from "@/lib/types/domain";
import { isBudgetInHistory } from "@/lib/budgets/budget-status";
import { ExpenseAmount } from "@/components/expenses/expense-amount";
import { TagList } from "@/components/expenses/tag-input";
import { formatDate } from "@/lib/utils";
import { BudgetExpenseForm } from "./budget-expense-form";

interface BudgetDetailProps extends MoneyDisplayContext {
  budget: BudgetWithTags;
}

export function BudgetDetail({
  budget,
  displayCurrency,
  rates,
}: BudgetDetailProps) {
  const { t } = useTranslation(["budgets", "common"]);
  // Loaded only when the card is expanded (not for every budget on page load).
  const expensesQuery = useBudgetExpenses(budget.id);
  const expenses = expensesQuery.data ?? [];
  const deleteBudgetExpense = useDeleteBudgetExpense();
  const rowDelete = useRowDelete(
    (expenseId) =>
      deleteBudgetExpense.mutateAsync({ budgetId: budget.id, expenseId }),
    t("common:confirmDelete"),
  );
  const inHistory = isBudgetInHistory(budget);

  return (
    <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
      {!inHistory && (
        <div>
          <p className="mb-3 font-mono text-xs text-muted">
            {t("budgets:addExpenseSection")}
          </p>
          <BudgetExpenseForm budget={budget} />
        </div>
      )}

      {expensesQuery.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        expenses.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-xs text-muted">
              {t("budgets:expensesSection")}
            </p>
            <div className="divide-y divide-border/60">
              {expenses.map((expense) => (
                <div key={expense.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-sm text-text">{expense.name}</p>
                      <p className="font-mono text-xs text-muted">
                        {formatDate(expense.date)} {"//"} <TagList tags={expense.tags} />
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ExpenseAmount
                        amount={formatChargedExpenseAmount(
                          expense.amount,
                          expense.currency,
                          displayCurrency,
                          rates,
                        )}
                        className="text-sm text-danger"
                      />
                      <Button
                        size="sm"
                        variant="danger"
                        className="h-7 px-2 text-xs"
                        loading={rowDelete.isPending(expense.id)}
                        onClick={() => void rowDelete.remove(expense.id)}
                      >
                        {t("common:delete")}
                      </Button>
                    </div>
                  </div>
                  {rowDelete.errorFor(expense.id) && (
                    <p className="mt-1 text-right font-mono text-xs text-danger">
                      {rowDelete.errorFor(expense.id)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
