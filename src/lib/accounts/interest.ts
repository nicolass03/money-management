import i18n from "@/lib/i18n";
import type { InterestRateType } from "@/lib/types/constants";

/** The acronym each rate convention is quoted with (the same in every language). */
const acronyms: Record<InterestRateType, string> = {
  apy: "APY",
  tae: "TAE",
  tin: "TIN",
  ea: "E.A.",
  namv: "N.A.M.V.",
  em: "E.M.",
};

const descriptionKeys: Record<InterestRateType, string> = {
  apy: "rateTypeApy",
  tae: "rateTypeTae",
  tin: "rateTypeTin",
  ea: "rateTypeEa",
  namv: "rateTypeNamv",
  em: "rateTypeEm",
};

const RATE_PATTERN = /^\d{1,3}(\.\d{1,2})?$/;

/** Dropdown label, e.g. "TAE — tasa anual equivalente (Spain)". */
export function interestRateTypeLabel(type: InterestRateType): string {
  return `${acronyms[type]} — ${i18n.t(`accounts:${descriptionKeys[type]}`)}`;
}

/** A rate as shown on the account, e.g. "8.25% E.A.". */
export function formatInterestRate(bps: number, type: InterestRateType): string {
  return `${(bps / 100).toFixed(2)}% ${acronyms[type]}`;
}

/** Form text ("8.25") for a rate in basis points; blank when the account earns no interest. */
export function formatBpsAsInput(bps: number): string {
  return bps > 0 ? (bps / 100).toFixed(2) : "";
}

/**
 * Percent text ("8.25", up to 2 decimals) → basis points (825). Blank means no interest (0);
 * `null` when invalid or above 100%.
 */
export function parseRateToBps(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (!RATE_PATTERN.test(trimmed)) return null;
  const bps = Math.round(Number(trimmed) * 100);
  return bps <= 10_000 ? bps : null;
}
