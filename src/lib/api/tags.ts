import { apiFetch } from "./client";

export async function getAllTagNames(): Promise<string[]> {
  return apiFetch<string[]>("/api/v1/tags");
}
