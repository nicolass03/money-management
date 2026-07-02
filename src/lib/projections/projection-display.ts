import { localTodayIso } from "@/lib/date/local-today";
import type { ProjectionRow } from "@/lib/types/domain";

/** Matches iOS `ProjectionDisplayLogic.futurePeriodLimit`. */
export const FUTURE_PERIOD_LIMIT = 10;

/** Matches iOS `ProjectionDisplayLogic.pastPeriodLimit`. */
export const PAST_PERIOD_LIMIT = 2;

/**
 * Up to two past pay periods, then current, then upcoming — older past rows hidden.
 * Parity with iOS `ProjectionDisplayLogic.visibleRows`.
 */
export function visibleProjectionRows(
  rows: ProjectionRow[],
  today: string = localTodayIso(),
): ProjectionRow[] {
  if (rows.length === 0) return [];

  const sorted = [...rows].sort((a, b) => a.payDate.localeCompare(b.payDate));

  const currentIndex = sorted.findIndex(
    (row) => today >= row.startDate && today <= row.endDate,
  );
  if (currentIndex !== -1) {
    const preceding = sorted.slice(
      Math.max(0, currentIndex - PAST_PERIOD_LIMIT),
      currentIndex,
    );
    const current = sorted[currentIndex];
    const following = sorted.slice(
      currentIndex + 1,
      currentIndex + 1 + FUTURE_PERIOD_LIMIT,
    );
    return [...preceding, current, ...following];
  }

  const upcomingIndex = sorted.findIndex((row) => row.endDate >= today);
  if (upcomingIndex !== -1) {
    const preceding = sorted.slice(
      Math.max(0, upcomingIndex - PAST_PERIOD_LIMIT),
      upcomingIndex,
    );
    const anchor = sorted[upcomingIndex];
    const following = sorted.slice(
      upcomingIndex + 1,
      upcomingIndex + 1 + FUTURE_PERIOD_LIMIT,
    );
    return [...preceding, anchor, ...following];
  }

  const lastIndex = sorted.length - 1;
  return sorted.slice(Math.max(0, lastIndex - PAST_PERIOD_LIMIT), lastIndex + 1);
}

export function isCurrentProjectionPeriod(
  row: Pick<ProjectionRow, "startDate" | "endDate">,
  today: string = localTodayIso(),
): boolean {
  return today >= row.startDate && today <= row.endDate;
}
