import { localTodayIso } from "@/lib/date/local-today";

export const MAX_REPORT_RANGE_DAYS = 730;

export type ReportDatePreset = "last-30" | "last-3-months" | "last-6-months" | "ytd";

export interface ReportDateRange {
  from: string;
  to: string;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return formatIso(date);
}

export function addMonthsIso(iso: string, months: number): string {
  const date = parseIso(iso);
  date.setMonth(date.getMonth() + months);
  return formatIso(date);
}

export function defaultReportRange(): ReportDateRange {
  const to = localTodayIso();
  const from = addDaysIso(to, -29);
  return { from, to };
}

export function presetToRange(preset: ReportDatePreset): ReportDateRange {
  const to = localTodayIso();
  switch (preset) {
    case "last-30":
      return { from: addDaysIso(to, -29), to };
    case "last-3-months":
      return { from: addMonthsIso(to, -3), to };
    case "last-6-months":
      return { from: addMonthsIso(to, -6), to };
    case "ytd": {
      const year = parseIso(to).getFullYear();
      return { from: `${year}-01-01`, to };
    }
  }
}

export function validateReportRange(from: string, to: string): string | null {
  if (!from || !to) {
    return "rangeRequired";
  }
  if (from > to) {
    return "rangeInverted";
  }
  const fromDate = parseIso(from);
  const toDate = parseIso(to);
  const dayCount =
    Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1;
  if (dayCount > MAX_REPORT_RANGE_DAYS) {
    return "rangeTooLong";
  }
  return null;
}

export function formatPriorDelta(
  current: number,
  prior: number,
): { text: string; positive: boolean } | null {
  if (prior === 0) {
    if (current === 0) return null;
    return { text: "+100%", positive: current > 0 };
  }
  const pct = ((current - prior) / prior) * 100;
  const rounded = Math.round(pct);
  if (rounded === 0) return null;
  return {
    text: `${rounded > 0 ? "+" : ""}${rounded}%`,
    positive: rounded > 0,
  };
}
