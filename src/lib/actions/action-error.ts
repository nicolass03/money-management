import "server-only";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";

export function handleActionError(
  error: unknown,
  fallback: string,
): { error: string } {
  if (error instanceof ApiError && error.status === 401) {
    redirect("/login");
  }
  return { error: fallback };
}
