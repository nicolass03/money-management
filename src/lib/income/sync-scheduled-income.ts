import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/index";
import type { DbClient } from "@/lib/db/client";
import { income, type IncomePaySchedule } from "@/lib/db/schema";
import { getPayDatesInRange, scheduleToInput } from "@/lib/income/pay-periods";

const SCHEDULED_SOURCE = "scheduled" as const;
const SYNC_YEARS_BACK = 1;
const SYNC_YEARS_FORWARD = 2;

function getSyncDateRange(anchorDate: string): { startDate: string; endDate: string } {
  const anchor = new Date(anchorDate);
  const start = new Date(anchor);
  start.setFullYear(start.getFullYear() - SYNC_YEARS_BACK);

  const end = new Date();
  end.setFullYear(end.getFullYear() + SYNC_YEARS_FORWARD);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export async function syncScheduledIncome(
  schedule: IncomePaySchedule,
  dbClient: DbClient = db,
) {
  const { startDate, endDate } = getSyncDateRange(schedule.anchorDate);
  const payDates = getPayDatesInRange(scheduleToInput(schedule), startDate, endDate);
  const now = new Date().toISOString();

  await dbClient.transaction(async (tx) => {
    if (payDates.length === 0) {
      await tx
        .delete(income)
        .where(
          and(
            eq(income.scheduleId, schedule.id),
            eq(income.source, SCHEDULED_SOURCE),
          ),
        );
      return;
    }

    const rows = payDates.map((payDate) => ({
      name: schedule.name,
      amount: schedule.amount,
      currency: schedule.currency,
      source: SCHEDULED_SOURCE,
      date: payDate,
      scheduleId: schedule.id,
      createdAt: now,
    }));

    await tx
      .insert(income)
      .values(rows)
      .onConflictDoUpdate({
        target: [income.scheduleId, income.date],
        targetWhere: sql`${income.source} = 'scheduled'`,
        set: {
          name: schedule.name,
          amount: schedule.amount,
          currency: schedule.currency,
        },
      });

    await tx
      .delete(income)
      .where(
        and(
          eq(income.scheduleId, schedule.id),
          eq(income.source, SCHEDULED_SOURCE),
          notInArray(income.date, payDates),
        ),
      );
  });
}

export async function deleteScheduledIncome(scheduleId: number, dbClient: DbClient = db) {
  await dbClient
    .delete(income)
    .where(
      and(eq(income.scheduleId, scheduleId), eq(income.source, SCHEDULED_SOURCE)),
    );
}
