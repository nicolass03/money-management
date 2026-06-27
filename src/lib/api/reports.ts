import { apiFetch } from "./client";
import type { ReportSummary } from "@/lib/types/domain";

export async function getReportSummary(
  from: string,
  to: string,
  comparePrior = true,
): Promise<ReportSummary> {
  const params = new URLSearchParams({
    from,
    to,
    comparePrior: String(comparePrior),
  });
  return apiFetch<ReportSummary>(
    `/api/v1/reports/summary?${params.toString()}`,
  );
}
