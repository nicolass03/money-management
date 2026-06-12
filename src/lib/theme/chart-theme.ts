export interface ChartTheme {
  tick: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  barFill: string;
  pieColors: string[];
}

const DARK_CHART_THEME: ChartTheme = {
  tick: "#6b6b6b",
  axis: "#2a2a2a",
  tooltipBg: "#141414",
  tooltipBorder: "#2a2a2a",
  barFill: "#d4d4d4",
  pieColors: ["#ffffff", "#d4d4d4", "#a3a3a3", "#737373", "#525252"],
};

const LIGHT_CHART_THEME: ChartTheme = {
  tick: "#737373",
  axis: "#e0e0e0",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e0e0e0",
  barFill: "#404040",
  pieColors: ["#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4"],
};

export function getChartTheme(resolvedTheme: string | undefined): ChartTheme {
  return resolvedTheme === "light" ? LIGHT_CHART_THEME : DARK_CHART_THEME;
}
