import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import i18n from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

const dateFormats = {
  day: { month: "short", day: "numeric", year: "numeric" },
  month: { month: "long", year: "numeric" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

/**
 * Formats a `YYYY-MM-DD` calendar date. `new Date("YYYY-MM-DD")` is UTC midnight, so format in UTC
 * too — otherwise every date renders a day early west of UTC.
 */
function formatUtcDate(date: string, format: keyof typeof dateFormats): string {
  const locale = i18n.resolvedLanguage === "es" ? "es-ES" : "en-US";
  const key = `${locale}:${format}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { ...dateFormats[format], timeZone: "UTC" });
    dateFormatters.set(key, formatter);
  }
  return formatter.format(new Date(date));
}

export function formatDate(date: string): string {
  return formatUtcDate(date, "day");
}

/** The month and year of a `YYYY-MM-DD` date, e.g. "October 2026". */
export function formatMonth(date: string): string {
  return formatUtcDate(date, "month");
}
