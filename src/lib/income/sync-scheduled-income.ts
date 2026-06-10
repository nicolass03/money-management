import { and, eq, notInArray } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { income, type IncomePaySchedule } from "@/lib/db/schema";
import { getPayDatesInRange, scheduleToInput } from "@/lib/income/pay-periods";

const SCHEDULED_SOURCE = "scheduled";
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

export async function syncScheduledIncome(schedule: IncomePaySchedule) {
  const { startDate, endDate } = getSyncDateRange(schedule.anchorDate);
  const payDates = getPayDatesInRange(scheduleToInput(schedule), startDate, endDate);
  const now = new Date().toISOString();

  for (const payDate of payDates) {
    const [existing] = await db
      .select()
      .from(income)
      .where(
        and(
          eq(income.scheduleId, schedule.id),
          eq(income.date, payDate),
          eq(income.source, SCHEDULED_SOURCE),
        ),
      );

    if (existing) {
      await db
        .update(income)
        .set({
          name: schedule.name,
          amount: schedule.amount,
          currency: schedule.currency,
        })
        .where(eq(income.id, existing.id));
    } else {
      await db.insert(income).values({
        name: schedule.name,
        amount: schedule.amount,
        currency: schedule.currency,
        source: SCHEDULED_SOURCE,
        date: payDate,
        scheduleId: schedule.id,
        createdAt: now,
      });
    }
  }

  if (payDates.length === 0) {
    await db
      .delete(income)
      .where(
        and(
          eq(income.scheduleId, schedule.id),
          eq(income.source, SCHEDULED_SOURCE),
        ),
      );
    return;
  }

  await db
    .delete(income)
    .where(
      and(
        eq(income.scheduleId, schedule.id),
        eq(income.source, SCHEDULED_SOURCE),
        notInArray(income.date, payDates),
      ),
    );
}

export async function deleteScheduledIncome(scheduleId: number) {
  await db
    .delete(income)
    .where(
      and(eq(income.scheduleId, scheduleId), eq(income.source, SCHEDULED_SOURCE)),
    );
}
