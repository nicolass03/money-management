import type { PayFrequency } from "@/lib/types/constants";
import type { IncomePaySchedule, RecurringExpense } from "@/lib/types/domain";

export interface PayPeriod {
  payDate: string;
  startDate: string;
  endDate: string;
}

export interface PayScheduleInput {
  anchorDate: string;
  frequency: PayFrequency;
  lastPaymentDate?: string | null;
}

function parseDate(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function toIso({ y, m, d }: { y: number; m: number; d: number }): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addDays(iso: string, days: number): string {
  const { y, m, d } = parseDate(iso);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toIso({
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
  });
}

function addMonths(iso: string, months: number): string {
  const { y, m, d } = parseDate(iso);
  const totalMonths = y * 12 + (m - 1) + months;
  const newY = Math.floor(totalMonths / 12);
  const newM = (totalMonths % 12) + 1;
  return toIso({ y: newY, m: newM, d: clampDayOfMonth(newY, newM, d) });
}

export const PROJECTION_MONTHS_FORWARD = 12;

function daysBetween(startIso: string, endIso: string): number {
  const start = parseDate(startIso);
  const end = parseDate(endIso);
  const startMs = new Date(start.y, start.m - 1, start.d).getTime();
  const endMs = new Date(end.y, end.m - 1, end.d).getTime();
  return Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function clampDayOfMonth(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

function monthlyPayDate(year: number, month: number, anchorDay: number): string {
  const d = clampDayOfMonth(year, month, anchorDay);
  return toIso({ y: year, m: month, d });
}

function compareIso(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function getEffectiveEndDate(
  schedule: PayScheduleInput,
  endDate: string,
): string {
  if (
    schedule.lastPaymentDate &&
    compareIso(schedule.lastPaymentDate, endDate) < 0
  ) {
    return schedule.lastPaymentDate;
  }
  return endDate;
}

function getIntervalDays(frequency: PayFrequency): number | null {
  if (frequency === "weekly") {
    return 7;
  }
  if (frequency === "biweekly") {
    return 14;
  }
  return null;
}

function getNextIntervalPayDate(
  anchor: string,
  fromDate: string,
  intervalDays: number,
): string {
  if (compareIso(fromDate, anchor) <= 0) {
    return anchor;
  }
  const diff = daysBetween(anchor, fromDate);
  const remainder = diff % intervalDays;
  if (remainder === 0) {
    return fromDate;
  }
  return addDays(fromDate, intervalDays - remainder);
}

function getNextMonthlyPayDate(anchorDate: string, fromDate: string): string {
  const anchorDay = parseDate(anchorDate).d;
  const { y, m } = parseDate(fromDate);
  const thisMonthPay = monthlyPayDate(y, m, anchorDay);
  if (compareIso(thisMonthPay, fromDate) >= 0) {
    return thisMonthPay;
  }

  const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  return monthlyPayDate(nextMonth.y, nextMonth.m, anchorDay);
}

function getNextYearlyPayDate(anchorDate: string, fromDate: string): string {
  const { m: anchorMonth, d: anchorDay } = parseDate(anchorDate);
  const { y } = parseDate(fromDate);
  const thisYearPay = toIso({
    y,
    m: anchorMonth,
    d: clampDayOfMonth(y, anchorMonth, anchorDay),
  });
  if (compareIso(thisYearPay, fromDate) >= 0) {
    return thisYearPay;
  }

  return toIso({
    y: y + 1,
    m: anchorMonth,
    d: clampDayOfMonth(y + 1, anchorMonth, anchorDay),
  });
}

function advancePayDate(schedule: PayScheduleInput, current: string): string {
  const intervalDays = getIntervalDays(schedule.frequency);
  if (intervalDays !== null) {
    return addDays(current, intervalDays);
  }

  if (schedule.frequency === "yearly") {
    return addMonths(current, 12);
  }

  const anchorDay = parseDate(schedule.anchorDate).d;
  const { y, m } = parseDate(current);
  const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  return monthlyPayDate(nextMonth.y, nextMonth.m, anchorDay);
}

export function getNextPayDate(
  schedule: PayScheduleInput,
  fromDate: string,
): string {
  const intervalDays = getIntervalDays(schedule.frequency);
  if (intervalDays !== null) {
    return getNextIntervalPayDate(schedule.anchorDate, fromDate, intervalDays);
  }

  if (schedule.frequency === "yearly") {
    return getNextYearlyPayDate(schedule.anchorDate, fromDate);
  }

  return getNextMonthlyPayDate(schedule.anchorDate, fromDate);
}

export function getPreviousPayDate(
  schedule: PayScheduleInput,
  payDate: string,
): string {
  const intervalDays = getIntervalDays(schedule.frequency);
  if (intervalDays !== null) {
    return addDays(payDate, -intervalDays);
  }

  if (schedule.frequency === "yearly") {
    const { y, m, d } = parseDate(payDate);
    return toIso({ y: y - 1, m, d: clampDayOfMonth(y - 1, m, d) });
  }

  const anchorDay = parseDate(schedule.anchorDate).d;
  const { y, m } = parseDate(payDate);
  const prevMonth = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  return monthlyPayDate(prevMonth.y, prevMonth.m, anchorDay);
}

export function getPeriodContaining(
  schedule: PayScheduleInput,
  date: string,
): PayPeriod {
  const payDate = getNextPayDate(schedule, date);
  const previousPayDate = getPreviousPayDate(schedule, payDate);
  return {
    payDate,
    startDate: addDays(previousPayDate, 1),
    endDate: payDate,
  };
}

export function getPayDatesInRange(
  schedule: PayScheduleInput,
  startDate: string,
  endDate: string,
): string[] {
  const effectiveEnd = getEffectiveEndDate(schedule, endDate);
  if (compareIso(startDate, effectiveEnd) > 0) {
    return [];
  }

  const dates: string[] = [];
  let current = getNextPayDate(schedule, startDate);

  while (compareIso(current, effectiveEnd) <= 0) {
    if (compareIso(current, startDate) >= 0) {
      dates.push(current);
    }

    current = advancePayDate(schedule, current);
  }

  return dates;
}

export function getUpcomingPayDates(
  schedule: PayScheduleInput,
  count: number,
  fromDate?: string,
): string[] {
  const start = fromDate ?? toIso({
    y: new Date().getFullYear(),
    m: new Date().getMonth() + 1,
    d: new Date().getDate(),
  });

  const dates: string[] = [];
  let current = getNextPayDate(schedule, start);

  while (dates.length < count) {
    if (
      schedule.lastPaymentDate &&
      compareIso(current, schedule.lastPaymentDate) > 0
    ) {
      break;
    }

    dates.push(current);
    current = advancePayDate(schedule, current);
  }

  return dates;
}

export function getRecentPeriods(
  schedule: PayScheduleInput,
  count: number,
  referenceDate?: string,
): PayPeriod[] {
  const ref =
    referenceDate ??
    toIso({
      y: new Date().getFullYear(),
      m: new Date().getMonth() + 1,
      d: new Date().getDate(),
    });

  const current = getPeriodContaining(schedule, ref);
  const periods: PayPeriod[] = [current];

  let payDate = current.payDate;
  while (periods.length < count) {
    const previousPayDate = getPreviousPayDate(schedule, payDate);
    periods.unshift({
      payDate: previousPayDate,
      startDate: addDays(getPreviousPayDate(schedule, previousPayDate), 1),
      endDate: previousPayDate,
    });
    payDate = previousPayDate;
  }

  return periods;
}

export function isDateInPeriod(
  date: string,
  period: PayPeriod,
): boolean {
  return compareIso(date, period.startDate) >= 0 && compareIso(date, period.endDate) <= 0;
}

export function scheduleToInput(
  schedule: IncomePaySchedule | RecurringExpense,
): PayScheduleInput {
  return {
    anchorDate: schedule.anchorDate,
    frequency: schedule.frequency,
    ...("lastPaymentDate" in schedule
      ? { lastPaymentDate: schedule.lastPaymentDate }
      : {}),
  };
}

export function getPeriodForPayDate(
  schedule: PayScheduleInput,
  payDate: string,
): PayPeriod {
  const previousPayDate = getPreviousPayDate(schedule, payDate);
  return {
    payDate,
    startDate: addDays(previousPayDate, 1),
    endDate: payDate,
  };
}

function compareIsoAsc(a: string, b: string): number {
  return compareIso(a, b);
}

export function getProjectionPeriods(
  schedule: PayScheduleInput,
  referenceDate?: string,
  projectionStartDate?: string | null,
  monthsForward: number = PROJECTION_MONTHS_FORWARD,
): PayPeriod[] {
  const ref =
    referenceDate ??
    toIso({
      y: new Date().getFullYear(),
      m: new Date().getMonth() + 1,
      d: new Date().getDate(),
    });

  const horizonEnd = addMonths(ref, monthsForward);
  const rangeStart = projectionStartDate ?? ref;
  const anchorDate =
    projectionStartDate && compareIso(projectionStartDate, ref) < 0
      ? projectionStartDate
      : ref;
  const anchorPeriod = getPeriodContaining(schedule, anchorDate);
  const periodMap = new Map<string, PayPeriod>();

  let payDate = anchorPeriod.payDate;
  while (periodMap.size < 50) {
    const period = getPeriodForPayDate(schedule, payDate);
    if (compareIso(period.startDate, horizonEnd) > 0) {
      break;
    }

    const overlapsHorizon =
      compareIso(period.endDate, rangeStart) >= 0 &&
      compareIso(period.startDate, horizonEnd) <= 0;

    if (overlapsHorizon) {
      periodMap.set(period.payDate, period);
    }

    payDate = getNextPayDate(schedule, addDays(payDate, 1));
  }

  return Array.from(periodMap.values()).sort((a, b) =>
    compareIsoAsc(a.payDate, b.payDate),
  );
}

const frequencyLabels: Record<PayFrequency, string> = {
  weekly: "weekly",
  biweekly: "every 2 weeks",
  monthly: "monthly",
  yearly: "yearly",
};

export function formatFrequency(frequency: PayFrequency): string {
  return frequencyLabels[frequency];
}
