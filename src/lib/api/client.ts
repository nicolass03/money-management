import { getApiUrl } from "@/lib/env";
import { supabase } from "@/lib/supabase/client";
import { triggerUnauthorized } from "./unauthorized";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new ApiError(401, "Not authenticated");
  }
  return token;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getAccessToken();

  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    triggerUnauthorized();
    throw new ApiError(401, "Not authenticated");
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let message = `API ${response.status}`;
    if (text) {
      try {
        const body = JSON.parse(text) as { error?: string };
        message = body.error ?? text;
      } catch {
        message = text;
      }
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
