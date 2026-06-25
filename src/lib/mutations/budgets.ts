import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBudget,
  createBudgetExpense,
  deleteBudget,
  deleteBudgetExpense,
  getBudgetById,
  updateBudget,
} from "@/lib/api/budgets";
import { getIncomeScheduleById } from "@/lib/api/income-schedules";
import { getUserSettingsFromApi } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";
import { isDatedBudget } from "@/lib/budgets/budget-status";
import { parseTagNames } from "@/lib/expenses/tag-utils";
import {
  getPeriodContaining,
  isDateInPeriod,
  scheduleToInput,
} from "@/lib/income/pay-periods";
import { localTodayIso } from "@/lib/date/local-today";
import { invalidateAfter } from "@/lib/query/invalidation";
import { currencies, type CurrencyCode } from "@/lib/types/constants";
import { tError } from "@/lib/i18n/errors";
import { parseDollarsToCents } from "@/lib/utils";
import { mutationError, type FormResult } from "./types";

function todayIso() {
  return localTodayIso();
}

async function getCurrentPayPeriod() {
  const settings = await getUserSettingsFromApi();
  if (!settings.primaryScheduleId) return null;
  const primarySchedule = await getIncomeScheduleById(settings.primaryScheduleId);
  if (!primarySchedule) return null;
  return getPeriodContaining(scheduleToInput(primarySchedule), todayIso());
}

function parseOptionalDate(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

export interface BudgetInput {
  name: string;
  amount: string;
  currency: string;
  startDate: string;
  endDate: string;
  tags: string;
}

function validateBudgetInput(data: BudgetInput):
  | { error: string }
  | {
      data: {
        name: string;
        amount: number;
        currency: CurrencyCode;
        startDate: string | null;
        endDate: string | null;
        tags: string[];
      };
    } {
  const name = data.name.trim();
  if (!name) return { error: tError("nameRequired") };
  const tags = parseTagNames(data.tags);
  if (tags.length === 0) return { error: tError("tagRequired") };
  if (!currencies.includes(data.currency as CurrencyCode)) {
    return { error: tError("invalidCurrency") };
  }
  const amount = parseDollarsToCents(data.amount);
  if (amount === null || amount <= 0) return { error: tError("invalidAmount") };
  const startDate = parseOptionalDate(data.startDate);
  const endDate = parseOptionalDate(data.endDate);
  const hasStart = startDate != null;
  const hasEnd = endDate != null;
  if (hasStart !== hasEnd) {
    return { error: tError("datedBudgetRequiresBothDates") };
  }
  if (hasStart && hasEnd && endDate! < startDate!) {
    return { error: tError("endDateBeforeStart") };
  }
  return {
    data: {
      name,
      amount,
      currency: data.currency as CurrencyCode,
      startDate,
      endDate,
      tags,
    },
  };
}

export async function createBudgetMutation(input: BudgetInput): Promise<FormResult> {
  const result = validateBudgetInput(input);
  if ("error" in result) return result;
  try {
    await createBudget(result.data);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedCreateBudget"));
  }
}

export async function updateBudgetMutation(
  id: string,
  input: BudgetInput,
): Promise<FormResult> {
  const result = validateBudgetInput(input);
  if ("error" in result) return result;
  try {
    const updated = await updateBudget(id, result.data);
    if (!updated) return { error: tError("budgetNotFound") };
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedUpdateBudget"));
  }
}

export async function deleteBudgetMutation(id: string): Promise<FormResult> {
  try {
    await deleteBudget(id);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError && error.message.includes("expenses")) {
      return { error: tError("cannotDeleteBudgetWithExpenses") };
    }
    return mutationError(error, tError("failedDeleteBudget"));
  }
}

export interface BudgetExpenseInput {
  name: string;
  amount: string;
  date: string;
}

export async function addBudgetExpenseMutation(
  budgetId: string,
  input: BudgetExpenseInput,
): Promise<FormResult> {
  const budget = await getBudgetById(budgetId);
  if (!budget) return { error: tError("budgetNotFound") };
  const amount = parseDollarsToCents(input.amount);
  if (amount === null || amount <= 0) return { error: tError("invalidAmount") };
  const date = input.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: tError("invalidDate") };
  const remaining = budget.amount - budget.spent;
  if (amount > remaining) return { error: tError("amountExceedsRemaining") };
  const period = await getCurrentPayPeriod();
  if (!period) return { error: tError("noPrimarySchedule") };
  if (!isDateInPeriod(date, period)) {
    return { error: tError("dateOutsidePayPeriod") };
  }
  const today = todayIso();
  const dated = isDatedBudget(budget);
  if (dated) {
    if (today < budget.startDate!) {
      return { error: tError("spendingLockedUntilStart") };
    }
    if (date < budget.startDate! || date > budget.endDate!) {
      return { error: tError("dateOutsideBudgetPeriod") };
    }
  }
  const name = input.name.trim() || budget.name;
  if (!name) return { error: tError("nameRequired") };
  try {
    await createBudgetExpense(budgetId, { name, amount, date });
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedAddBudgetExpense"));
  }
}

export async function deleteBudgetExpenseMutation(
  budgetId: string,
  expenseId: string,
): Promise<FormResult> {
  try {
    await deleteBudgetExpense(budgetId, expenseId);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedDeleteBudgetExpense"));
  }
}

function useBudgetInvalidation() {
  const queryClient = useQueryClient();
  return (result: FormResult) => {
    if (result.success) void invalidateAfter(queryClient, "budgetChange");
  };
}

export function useCreateBudget() {
  const onDone = useBudgetInvalidation();
  return useMutation({
    mutationFn: createBudgetMutation,
    onSuccess: onDone,
  });
}

export function useUpdateBudget() {
  const onDone = useBudgetInvalidation();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BudgetInput }) =>
      updateBudgetMutation(id, input),
    onSuccess: onDone,
  });
}

export function useDeleteBudget() {
  const onDone = useBudgetInvalidation();
  return useMutation({
    mutationFn: deleteBudgetMutation,
    onSuccess: onDone,
  });
}

export function useAddBudgetExpense() {
  const onDone = useBudgetInvalidation();
  return useMutation({
    mutationFn: ({
      budgetId,
      input,
    }: {
      budgetId: string;
      input: BudgetExpenseInput;
    }) => addBudgetExpenseMutation(budgetId, input),
    onSuccess: onDone,
  });
}

export function useDeleteBudgetExpense() {
  const onDone = useBudgetInvalidation();
  return useMutation({
    mutationFn: ({
      budgetId,
      expenseId,
    }: {
      budgetId: string;
      expenseId: string;
    }) => deleteBudgetExpenseMutation(budgetId, expenseId),
    onSuccess: onDone,
  });
}
