"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addBudgetExpenseAction,
  type BudgetFormState,
} from "@/lib/actions/budgets";
import type { BudgetWithTags } from "@/lib/db/schema";
import { isDatedBudget } from "@/lib/budgets/budget-status";
import { formatCentsAsDollarsInput } from "@/lib/utils";

const initialState: BudgetFormState = {};

interface BudgetExpenseFormProps {
  budget: BudgetWithTags;
  onSuccess?: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BudgetExpenseForm({ budget, onSuccess }: BudgetExpenseFormProps) {
  const dated = isDatedBudget(budget);
  const today = todayIso();
  const canSpend = !dated || today >= budget.startDate!;
  const remaining = budget.amount - budget.spent;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);

  const action = addBudgetExpenseAction.bind(null, budget.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      setName("");
      setAmount("");
      setDate(todayIso());
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  if (!canSpend) {
    return (
      <p className="font-mono text-xs text-muted">
        {`> spending unlocks ${budget.startDate}`}
      </p>
    );
  }

  if (remaining <= 0) {
    return (
      <p className="font-mono text-xs text-muted">{"> budget fully spent."}</p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {dated && (
        <div>
          <label
            htmlFor={`budget-expense-name-${budget.id}`}
            className="mb-2 block font-mono text-xs text-muted"
          >
            description:
          </label>
          <Input
            id={`budget-expense-name-${budget.id}`}
            name="name"
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
            amount:
          </label>
          <Input
            id={`budget-expense-amount-${budget.id}`}
            name="amount"
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
            date:
          </label>
          <Input
            id={`budget-expense-date-${budget.id}`}
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      {state.error && (
        <p className="font-mono text-xs text-danger">{state.error}</p>
      )}

      <Button type="submit" size="sm" loading={pending}>
        {pending ? "adding..." : "add expense"}
      </Button>
    </form>
  );
}
