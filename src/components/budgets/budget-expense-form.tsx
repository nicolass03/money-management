import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddBudgetExpense } from "@/lib/mutations/budgets";
import type { BudgetWithTags } from "@/lib/types/domain";
import { isDatedBudget } from "@/lib/budgets/budget-status";
import { formatCentsAsDollarsInput } from "@/lib/utils";

interface BudgetExpenseFormProps {
  budget: BudgetWithTags;
  onSuccess?: () => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function BudgetExpenseForm({ budget, onSuccess }: BudgetExpenseFormProps) {
  const { t } = useTranslation(["budgets", "common"]);
  const dated = isDatedBudget(budget);
  const today = todayIso();
  const canSpend = !dated || today >= budget.startDate!;
  const remaining = budget.amount - budget.spent;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");

  const addExpense = useAddBudgetExpense();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = await addExpense.mutateAsync({
      budgetId: budget.id,
      input: { name, amount, date },
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
    setAmount("");
    setDate(todayIso());
    onSuccess?.();
  }

  if (!canSpend) {
    return (
      <p className="font-mono text-xs text-muted">
        {t("budgets:spendingUnlocks", { date: budget.startDate })}
      </p>
    );
  }

  if (remaining <= 0) {
    return (
      <p className="font-mono text-xs text-muted">{t("budgets:budgetFullySpent")}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {dated && (
        <div>
          <label
            htmlFor={`budget-expense-name-${budget.id}`}
            className="mb-2 block font-mono text-xs text-muted"
          >
            {t("budgets:labelDescription")}
          </label>
          <Input
            id={`budget-expense-name-${budget.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={budget.name}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`budget-expense-amount-${budget.id}`}
            className="mb-2 block font-mono text-xs text-muted"
          >
            {t("common:labelAmount")}
          </label>
          <Input
            id={`budget-expense-amount-${budget.id}`}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={formatCentsAsDollarsInput(remaining)}
            required
          />
        </div>

        <div>
          <label
            htmlFor={`budget-expense-date-${budget.id}`}
            className="mb-2 block font-mono text-xs text-muted"
          >
            {t("common:labelDate")}
          </label>
          <Input
            id={`budget-expense-date-${budget.id}`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="font-mono text-xs text-danger">{error}</p>}

      <Button type="submit" size="sm" loading={addExpense.isPending}>
        {addExpense.isPending ? t("budgets:adding") : t("budgets:submitAddExpense")}
      </Button>
    </form>
  );
}
