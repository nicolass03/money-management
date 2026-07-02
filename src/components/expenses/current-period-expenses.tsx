import { useEffect, useState, useTransition } from "react";
import { Link } from "@tanstack/react-router";
import { Trans, useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import {
  useDeleteExpense,
  useUpdateExpenseAmount,
} from "@/lib/mutations/expenses";
import { usePrivacyMode } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { maskNumericValue } from "@/lib/privacy/mask";
import type { MoneyDisplayContext } from "@/lib/currency/display";
import type { TFunction } from "i18next";
import { formatProjectionExpenseAmount } from "@/lib/currency/expense-display";
import { ExpenseAmount } from "./expense-amount";
import type {
  CurrencyCode,
  ExpensePeriodKey,
  ExpensePeriodView,
  IncomePaySchedule,
  PayableFutureItem,
  ProjectionExpenseItem,
} from "@/lib/types/domain";
import { Skeleton } from "@/components/ui/skeleton";
import { localTodayIso } from "@/lib/date/local-today";
import { cn, formatCentsAsDollarsInput, formatDate } from "@/lib/utils";
import { ExpenseForm } from "./expense-form";
import {
  EarlyPaymentPanelSkeleton,
  ExpensePeriodListSkeleton,
} from "./expense-loading-skeletons";
import { MarkEarlyPaymentPanel } from "./mark-early-payment-panel";
import { TagList } from "./tag-input";

interface CurrentPeriodExpensesProps extends MoneyDisplayContext {
  primarySchedule: IncomePaySchedule | null;
  periodView: ExpensePeriodView | null;
  periodKey: ExpensePeriodKey;
  periodLoading?: boolean;
  upcomingPayableItems: PayableFutureItem[];
  upcomingLoading?: boolean;
}

function periodSectionTitle(
  periodKey: ExpensePeriodKey,
  t: TFunction<["expenses", "common"]>,
): string {
  if (periodKey === "last-period") {
    return t("expenses:sectionCurrentPeriod");
  }
  if (periodKey === "last-month") {
    return t("expenses:sectionLastMonth");
  }
  return t("expenses:sectionLast3Months");
}

function periodSectionSubtitle(
  periodView: ExpensePeriodView | null,
  periodKey: ExpensePeriodKey,
  t: TFunction<["expenses", "common"]>,
): string {
  if (!periodView) {
    return periodKey === "last-period"
      ? t("expenses:subtitlePayPeriodDefault")
      : t("expenses:subtitleRangeDefault");
  }

  const range = formatPeriodRange(
    periodView.period.startDate,
    periodView.period.endDate,
  );

  if (periodView.isPayPeriod) {
    return t("expenses:subtitlePayday", {
      range,
      date: formatDate(periodView.period.payDate),
    });
  }

  return t("expenses:subtitleActualExpenses", { range });
}

function formatPeriodRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

function ExpenseAmountEditor({
  expenseId,
  initialAmount,
  displayCurrency,
  rates,
  onDone,
}: {
  expenseId: string;
  initialAmount: number;
  displayCurrency: CurrencyCode;
  rates: MoneyDisplayContext["rates"];
  onDone: () => void;
}) {
  const { t } = useTranslation("common");
  const [amount, setAmount] = useState(formatCentsAsDollarsInput(initialAmount));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateAmount = useUpdateExpenseAmount();

  function handleSave() {
    startTransition(async () => {
      const result = await updateAmount.mutateAsync({ id: expenseId, amount });
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      onDone();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-8 w-24 px-2 text-right"
      />
      <Button size="sm" loading={pending} onClick={handleSave}>
        {pending ? t("saving") : t("save")}
      </Button>
      <Button size="sm" variant="ghost" onClick={onDone}>
        {t("cancel")}
      </Button>
      {error && (
        <span className="font-mono text-xs text-danger">{error}</span>
      )}
    </div>
  );
}

function isExtraExpense(item: ProjectionExpenseItem): boolean {
  return (
    item.id != null &&
    !item.projected &&
    !item.isBudgetSummary &&
    item.recurringId == null &&
    item.plannedExpenseId == null &&
    item.budgetId == null
  );
}

function ExpenseRow({
  item,
  editingId,
  setEditingId,
  displayCurrency,
  rates,
  onDelete,
  deletePending,
}: {
  item: ProjectionExpenseItem;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  displayCurrency: CurrencyCode;
  rates: MoneyDisplayContext["rates"];
  onDelete: (id: string) => void;
  deletePending: boolean;
}) {
  const { t } = useTranslation(["expenses", "common"]);

  const key =
    item.id ??
    (item.budgetId != null
      ? `budget-${item.budgetId}`
      : `proj-${item.recurringId}-${item.date}`);
  const canEdit =
    item.id != null && !item.projected && !item.isBudgetSummary;

  function rowMetaSuffix() {
    if (item.isBudgetSummary) {
      return t("expenses:rowSuffixBudget");
    }
    if (item.projected) {
      return t("expenses:rowSuffixDue");
    }
    if (item.budgetId != null) {
      return t("expenses:rowSuffixFromBudget");
    }
    return null;
  }

  function rowMetaPrefix() {
    if (item.isBudgetSummary) {
      return t("expenses:rowBudgetTracking");
    }
    if (item.projected) {
      return t("expenses:rowDue", { date: formatDate(dueDate(item)) });
    }
    if (item.scheduledDate) {
      return t("expenses:rowPaidDue", {
        paid: formatDate(item.date),
        due: formatDate(item.scheduledDate),
      });
    }
    return t("expenses:rowPaid", { date: formatDate(item.date) });
  }

  return (
    <div
      key={key}
      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
    >
      <div>
        <div className="flex items-center gap-2">
          {item.isBudgetSummary && item.budgetId != null ? (
            <Link
              to="/budgets"
              className="font-mono text-sm text-text hover:text-accent-glow"
            >
              {item.name}
            </Link>
          ) : (
            <p className="font-mono text-sm text-text">{item.name}</p>
          )}
          {item.isBudgetSummary && (
            <Badge variant="accent">{t("expenses:badgeBudget")}</Badge>
          )}
          {item.isSubscription && (
            <Badge variant="default">{t("expenses:badgeSubscription")}</Badge>
          )}
          {isExtraExpense(item) && (
            <Badge variant="warning">{t("expenses:badgeExtra")}</Badge>
          )}
        </div>
        <p className="font-mono text-xs text-muted">
          {rowMetaPrefix()} {"//"} <TagList tags={item.tags} />
          {rowMetaSuffix() != null && <> {rowMetaSuffix()}</>}
        </p>
      </div>
      <div className="text-right">
        {canEdit && editingId === item.id ? (
          <ExpenseAmountEditor
            expenseId={item.id!}
            initialAmount={item.amount}
            displayCurrency={displayCurrency}
            rates={rates}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <>
            <div className="flex items-center justify-end gap-2">
              <ExpenseAmount
                amount={formatProjectionExpenseAmount(
                  item,
                  displayCurrency,
                  rates,
                )}
                className="text-sm text-danger"
              />
              {canEdit && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn("h-7 px-2 text-xs")}
                    onClick={() => setEditingId(item.id!)}
                  >
                    {t("common:edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className={cn("h-7 px-2 text-xs")}
                    loading={deletePending}
                    onClick={() => onDelete(item.id!)}
                  >
                    {deletePending ? t("common:deleting") : t("common:delete")}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function dueDate(item: ProjectionExpenseItem): string {
  return item.scheduledDate ?? item.date;
}

function sortByDateDesc(items: ProjectionExpenseItem[]): ProjectionExpenseItem[] {
  return [...items].sort((a, b) => dueDate(b).localeCompare(dueDate(a)));
}

export function CurrentPeriodExpenses({
  primarySchedule,
  periodView,
  periodKey,
  periodLoading = false,
  upcomingPayableItems,
  upcomingLoading = false,
  displayCurrency,
  rates,
}: CurrentPeriodExpensesProps) {
  const { t } = useTranslation(["expenses", "common"]);
  const { privacyMode } = usePrivacyMode();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const deleteExpense = useDeleteExpense();
  const today = localTodayIso();

  useEffect(() => {
    setShowAdd(false);
  }, [periodKey]);

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      await deleteExpense.mutateAsync(id);
      if (editingId === id) {
        setEditingId(null);
      }
    });
  }

  function formatDisplay(amount: number) {
    const formatted = formatMoney(
      amount,
      displayCurrency,
      displayCurrency,
      rates,
    );
    return privacyMode ? maskNumericValue(formatted) : formatted;
  }

  const listItems = sortByDateDesc(
    (periodView?.items ?? []).filter((item) => !item.projected),
  );

  const total = listItems.reduce((sum, item) => sum + item.convertedAmount, 0);

  const canAddExpense = periodKey === "last-period" && periodView?.isPayPeriod;

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title={periodSectionTitle(periodKey, t)}
          subtitle={
            periodLoading ? (
              <Skeleton className="h-3 w-56" />
            ) : (
              periodSectionSubtitle(periodView, periodKey, t)
            )
          }
          className="mb-0"
        />
        <div className="flex items-center gap-3">
          {periodLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            listItems.length > 0 && (
              <Badge variant="accent">{formatDisplay(total)}</Badge>
            )
          )}
          {!periodLoading && canAddExpense && primarySchedule && periodView && (
            <Button
              size="sm"
              variant={showAdd ? "ghost" : "primary"}
              onClick={() => setShowAdd((open) => !open)}
            >
              {showAdd ? t("common:cancel") : t("expenses:addExpense")}
            </Button>
          )}
        </div>
      </div>

      {showAdd && canAddExpense && periodView && (
        <Card className="mb-4">
          <ExpenseForm
            defaultDate={today}
            onCancel={() => setShowAdd(false)}
            onSuccess={() => setShowAdd(false)}
          />
        </Card>
      )}

      <Card>
        {periodLoading ? (
          <ExpensePeriodListSkeleton />
        ) : periodKey === "last-period" && !primarySchedule ? (
          <p className="font-mono text-sm text-muted">
            <Trans
              i18nKey="expenses:noScheduleHint"
              components={{
                link: (
                  <Link
                    to="/settings"
                    className="text-accent hover:text-accent-glow"
                  />
                ),
              }}
            />
          </p>
        ) : listItems.length === 0 ? (
          <p className="font-mono text-sm text-muted">{t("expenses:emptyPeriod")}</p>
        ) : (
          <div className="divide-y divide-border">
            {listItems.map((item) => (
              <ExpenseRow
                key={item.id ?? `proj-${item.recurringId ?? item.plannedExpenseId}-${item.date}`}
                item={item}
                editingId={editingId}
                setEditingId={setEditingId}
                displayCurrency={displayCurrency}
                rates={rates}
                onDelete={handleDelete}
                deletePending={deletePending}
              />
            ))}
          </div>
        )}
      </Card>

      {canAddExpense && primarySchedule && (periodView || periodLoading) && (
        periodLoading || upcomingLoading ? (
          <EarlyPaymentPanelSkeleton />
        ) : periodView ? (
          <MarkEarlyPaymentPanel
            upcomingItems={upcomingPayableItems}
            periodStartDate={periodView.period.startDate}
            periodEndDate={periodView.period.endDate}
            defaultPaidDate={today}
          />
        ) : null
      )}
    </section>
  );
}
