"use client";

import { useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useDeleteBudgetExpense } from "@/lib/mutations/budgets";
import { formatChargedExpenseAmount } from "@/lib/currency/expense-display";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { BudgetWithTags, ExpenseWithTags } from "@/lib/types/domain";
import { ExpenseAmount } from "@/components/expenses/expense-amount";
import { TagList } from "@/components/expenses/tag-input";
import { formatDate } from "@/lib/utils";
import { BudgetExpenseForm } from "./budget-expense-form";

interface BudgetDetailProps extends MoneyDisplayContext {
  budget: BudgetWithTags;
  expenses: ExpenseWithTags[];
}

export function BudgetDetail({
  budget,
  expenses,
  displayCurrency,
  rates,
}: BudgetDetailProps) {
  const { t } = useTranslation(["budgets", "common"]);
  const [pending, startTransition] = useTransition();
  const deleteBudgetExpense = useDeleteBudgetExpense();

  function handleDelete(expenseId: string) {
    startTransition(async () => {
      await deleteBudgetExpense.mutateAsync({
        budgetId: budget.id,
        expenseId,
      });
    });
  }

  return (
    <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
      <div>
        <p className="mb-3 font-mono text-xs text-muted">
          {t("budgets:addExpenseSection")}
        </p>
        <BudgetExpenseForm budget={budget} />
      </div>

      {expenses.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-xs text-muted">
            {t("budgets:expensesSection")}
          </p>
          <div className="divide-y divide-border/60">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
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
                    loading={pending}
                    onClick={() => handleDelete(expense.id)}
                  >
                    {t("common:delete")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
