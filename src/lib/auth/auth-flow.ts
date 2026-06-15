import type { Session } from "@supabase/supabase-js";
import { getPasswordFlow } from "@/lib/auth/password-flow";

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

/** Invited users must set a password before using the app (client hint; API enforces onboarding). */
export function needsPasswordSetup(session: Session | null): boolean {
  if (!session?.user) return false;

  const metadata = session.user.user_metadata as Record<string, unknown>;
  if (metadata.password_set === true) return false;

  return Boolean(session.user.invited_at);
}

export function canAccessApp(session: Session | null): boolean {
  if (!session?.access_token) return false;
  return !needsPasswordSetup(session);
}

/** Whether /set-password should accept this session (invite, recovery, or pending invite). */
export function canSetPassword(session: Session | null): boolean {
  if (!session?.access_token) return false;
  if (needsPasswordSetup(session)) return true;
  if (isPasswordSetupFlow(getAuthCallbackType())) return true;
  return getPasswordFlow() === "recovery";
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
