"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TerminalModal } from "@/components/ui/terminal-modal";
import { MoneyText } from "@/components/layout/privacy-mode";
import { useDeleteBudget, useFinishBudget } from "@/lib/mutations/budgets";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { BudgetWithTags, ExpenseWithTags } from "@/lib/types/domain";
import {
  getBudgetStatus,
  isBudgetFinishable,
  isBudgetInHistory,
  isDatedBudget,
  type BudgetStatus,
} from "@/lib/budgets/budget-status";
import { TagList } from "@/components/expenses/tag-input";
import { cn, formatDate } from "@/lib/utils";
import { BudgetDetail } from "./budget-detail";
import { BudgetForm } from "./budget-form";

interface BudgetCardProps extends MoneyDisplayContext {
  budget: BudgetWithTags;
  expenses: ExpenseWithTags[];
  onFinishSuccess?: () => void;
}

const STATUS_KEYS: Record<BudgetStatus, string> = {
  active: "statusActive",
  upcoming: "statusUpcoming",
  open: "statusOpen",
  ended: "statusEnded",
  depleted: "statusDepleted",
};

function statusBadgeVariant(
  status: BudgetStatus,
): "accent" | "success" | "default" {
  if (status === "upcoming") return "accent";
  if (status === "active") return "success";
  return "default";
}

function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function BudgetCard({
  budget,
  expenses,
  displayCurrency,
  rates,
  onFinishSuccess,
}: BudgetCardProps) {
  const { t } = useTranslation(["budgets", "common"]);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [pending, startTransition] = useTransition();
  const deleteBudget = useDeleteBudget();
  const finishBudget = useFinishBudget();
  const ctx = { displayCurrency, rates };

  const status = getBudgetStatus(budget);
  const inHistory = isBudgetInHistory(budget);
  const finishable = isBudgetFinishable(budget);
  const spentDisplay = toDisplayAmount(budget.spent, budget.currency, ctx);
  const totalDisplay = toDisplayAmount(budget.amount, budget.currency, ctx);
  const progress = Math.min(100, (budget.spent / budget.amount) * 100);

  function handleDelete() {
    startTransition(async () => {
      await deleteBudget.mutateAsync(budget.id);
    });
  }

  async function handleFinish() {
    setFinishError("");
    const result = await finishBudget.mutateAsync(budget.id);
    if (result.error) {
      setFinishError(result.error);
      return;
    }
    setFinishOpen(false);
    setExpanded(false);
    onFinishSuccess?.();
  }

  if (editing && !inHistory) {
    return (
      <Card>
        <BudgetForm
          budget={budget}
          displayCurrency={displayCurrency}
          rates={rates}
          onCancel={() => setEditing(false)}
          onSuccess={() => setEditing(false)}
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm text-text">{budget.name}</p>
            <Badge variant={statusBadgeVariant(status)}>
              {budget.completedAt != null
                ? t("budgets:statusCompleted")
                : t(`budgets:${STATUS_KEYS[status]}`)}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-muted">
            {isDatedBudget(budget) ? (
              <>
                {formatDateRange(budget.startDate!, budget.endDate!)} {"//"}{" "}
              </>
            ) : (
              <>{t("budgets:openEnded")} {"//"} </>
            )}
            <TagList tags={budget.tags} />
          </p>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between font-mono text-xs">
              <span className="text-muted">{t("budgets:spentTotal")}</span>
              <span className="text-text">
                <MoneyText
                  value={`${formatMoney(spentDisplay, displayCurrency, displayCurrency, rates)} / ${formatMoney(totalDisplay, displayCurrency, displayCurrency, rates)}`}
                />
              </span>
            </div>
            <div className="h-1.5 w-full bg-bg">
              <div
                className={cn(
                  "h-full transition-all",
                  progress >= 100 ? "bg-danger" : "bg-accent",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="shrink-0"
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? t("budgets:collapse") : t("budgets:expand")}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!inHistory && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            {t("common:edit")}
          </Button>
        )}
        {finishable && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFinishError("");
              setFinishOpen(true);
            }}
          >
            {t("budgets:finishBudget")}
          </Button>
        )}
        <Button
          size="sm"
          variant="danger"
          loading={pending}
          onClick={handleDelete}
        >
          {pending ? t("common:deleting") : t("common:delete")}
        </Button>
      </div>

      <TerminalModal
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title={t("budgets:finishConfirmTitle")}
        subtitle={t("budgets:finishConfirmBody")}
      >
        <div className="space-y-4">
          {finishError && (
            <p className="font-mono text-sm text-danger">{finishError}</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              loading={finishBudget.isPending}
              onClick={handleFinish}
            >
              {finishBudget.isPending
                ? t("budgets:finishing")
                : t("budgets:finishBudget")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFinishOpen(false)}
            >
              {t("common:cancel")}
            </Button>
          </div>
        </div>
      </TerminalModal>

      {expanded && (
        <BudgetDetail
          budget={budget}
          expenses={expenses}
          displayCurrency={displayCurrency}
          rates={rates}
        />
      )}
    </Card>
  );
}
