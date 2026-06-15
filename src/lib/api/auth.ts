import { apiFetch } from "@/lib/api/client";

export async function completeOnboarding(): Promise<void> {
  await apiFetch<void>("/api/v1/auth/complete-onboarding", { method: "POST" });
}
