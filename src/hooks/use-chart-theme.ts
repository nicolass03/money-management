"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";
import { getChartTheme, type ChartTheme } from "@/lib/theme/chart-theme";

export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();

  return useMemo(() => getChartTheme(resolvedTheme), [resolvedTheme]);
}
