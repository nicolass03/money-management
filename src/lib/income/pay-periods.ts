import type {
  IncomePaySchedule,
  PayFrequency,
  RecurringExpense,
} from "@/lib/db/schema";

export interface PayPeriod {
  payDate: string;
  startDate: string;
  endDate: string;
}

export interface PayScheduleInput {
  anchorDate: string;
  frequency: PayFrequency;
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

export function getNextPayDate(
  schedule: PayScheduleInput,
  fromDate: string,
): string {
  if (schedule.frequency === "biweekly") {
    const anchor = schedule.anchorDate;
    if (compareIso(fromDate, anchor) <= 0) {
      return anchor;
    }
    const diff = daysBetween(anchor, fromDate);
    const remainder = diff % 14;
    if (remainder === 0) {
      return fromDate;
    }
    return addDays(fromDate, 14 - remainder);
  }

  const anchorDay = parseDate(schedule.anchorDate).d;
  const { y, m } = parseDate(fromDate);
  const thisMonthPay = monthlyPayDate(y, m, anchorDay);
  if (compareIso(thisMonthPay, fromDate) >= 0) {
    return thisMonthPay;
  }

  const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  return monthlyPayDate(nextMonth.y, nextMonth.m, anchorDay);
}

export function getPreviousPayDate(
  schedule: PayScheduleInput,
  payDate: string,
): string {
  if (schedule.frequency === "biweekly") {
    return addDays(payDate, -14);
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
  const dates: string[] = [];
  let current = getNextPayDate(schedule, startDate);

  while (compareIso(current, endDate) <= 0) {
    if (compareIso(current, startDate) >= 0) {
      dates.push(current);
    }

    if (schedule.frequency === "biweekly") {
      current = addDays(current, 14);
    } else {
      const anchorDay = parseDate(schedule.anchorDate).d;
      const { y, m } = parseDate(current);
      const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
      current = monthlyPayDate(nextMonth.y, nextMonth.m, anchorDay);
    }
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
    dates.push(current);
    if (schedule.frequency === "biweekly") {
      current = addDays(current, 14);
    } else {
      const anchorDay = parseDate(schedule.anchorDate).d;
      const { y, m } = parseDate(current);
      const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
      current = monthlyPayDate(nextMonth.y, nextMonth.m, anchorDay);
    }
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
): PayPeriod[] {
  const ref =
    referenceDate ??
    toIso({
      y: new Date().getFullYear(),
      m: new Date().getMonth() + 1,
      d: new Date().getDate(),
    });

  const periodMap = new Map<string, PayPeriod>();

  if (projectionStartDate) {
    const startPeriod = getPeriodContaining(schedule, projectionStartDate);
    const lastUpcomingPayDate =
      getUpcomingPayDates(schedule, 12, ref).at(-1) ?? startPeriod.payDate;

    let payDate = startPeriod.payDate;
    while (compareIso(payDate, lastUpcomingPayDate) <= 0) {
      const period = getPeriodForPayDate(schedule, payDate);
      if (compareIso(period.endDate, projectionStartDate) >= 0) {
        periodMap.set(period.payDate, period);
      }
      payDate = getNextPayDate(schedule, addDays(payDate, 1));
      if (periodMap.size > 30) break;
    }
  } else {
    for (const period of getRecentPeriods(schedule, 6, ref)) {
      periodMap.set(period.payDate, period);
    }

    for (const payDate of getUpcomingPayDates(schedule, 12, ref)) {
      if (!periodMap.has(payDate)) {
        periodMap.set(payDate, getPeriodForPayDate(schedule, payDate));
      }
    }
  }

  return Array.from(periodMap.values()).sort((a, b) =>
    compareIsoAsc(a.payDate, b.payDate),
  );
}

export function formatFrequency(frequency: PayFrequency): string {
  return frequency === "biweekly" ? "every 2 weeks" : "monthly";
}
