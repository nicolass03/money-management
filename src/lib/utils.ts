import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import i18n from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** @deprecated Use formatMoney from @/lib/currency/format */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDate(date: string): string {
  const locale = i18n.resolvedLanguage === "es" ? "es-ES" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

