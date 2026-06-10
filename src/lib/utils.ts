import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function parseDollarsToCents(value: string): number | null {
  const trimmed = value.trim().replace(/[$,]/g, "");
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

export function parseSignedDollarsToCents(value: string): number | null {
  const trimmed = value.trim().replace(/[$,]/g, "");
  if (!trimmed) return 0;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * 100);
}

export function formatCentsAsDollarsInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
