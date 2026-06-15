import type { Session } from "@supabase/supabase-js";

export type AuthCallbackType = "invite" | "recovery" | "signup" | "email" | null;

/** Parse `type` from the current URL hash or query (Supabase auth redirects). */
export function getAuthCallbackType(): AuthCallbackType {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(window.location.search);

  const type = hashParams.get("type") ?? queryParams.get("type");
  if (
    type === "invite" ||
    type === "recovery" ||
    type === "signup" ||
    type === "email"
  ) {
    return type;
  }
  return null;
}

export function isPasswordSetupFlow(type: AuthCallbackType): boolean {
  return type === "invite" || type === "recovery";
}

/** Invited users must set a password before using the app. */
export function needsPasswordSetup(session: Session | null): boolean {
  if (!session?.user) return false;

  const metadata = session.user.user_metadata as Record<string, unknown>;
  if (metadata.password_set === true) return false;

  return Boolean(session.user.invited_at);
}

export function clearAuthParamsFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.delete("code");
  url.searchParams.delete("type");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  window.history.replaceState({}, "", url.pathname + url.search);
}
