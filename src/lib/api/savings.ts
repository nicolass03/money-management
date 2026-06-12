import type { Saving } from "@/lib/types/domain";
import { apiFetch } from "./client";

export async function getSavings(): Promise<Saving[]> {
  return apiFetch<Saving[]>("/api/v1/savings");
}
