import type { Session } from "@supabase/supabase-js";
import { getPasswordFlow, setPasswordFlow } from "@/lib/auth/password-flow";
import { supabase } from "@/lib/supabase/client";

export type AuthCallbackType = "invite" | "recovery" | "signup" | "email" | null;

export type EstablishSessionResult =
  | { status: "ready" }
  | { status: "no_session" }
  | { status: "invalid"; reason: "callback_failed" | "user_not_found" };

function isUserNotFoundError(message: string, code?: string): boolean {
  const normalized = message.toLowerCase();
  return (
    code === "user_not_found" ||
    normalized.includes("user from sub claim") ||
    normalized.includes("user not found")
  );
}

/** Exchange PKCE `?code=` (if present), then validate the session against Supabase Auth. */
export async function establishAuthSessionFromUrl(): Promise<EstablishSessionResult> {
  const callbackType = getAuthCallbackType();
  const params = new URLSearchParams(window.location.search);
  const authError = params.get("error_description") ?? params.get("error");

  if (authError) {
    clearAuthParamsFromUrl();
    return { status: "invalid", reason: "callback_failed" };
  }

  const code = params.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      clearAuthParamsFromUrl();
      return { status: "invalid", reason: "callback_failed" };
    }
    if (callbackType === "recovery") {
      setPasswordFlow("recovery");
    }
    clearAuthParamsFromUrl();
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    if (error && isUserNotFoundError(error.message, error.code)) {
      await supabase.auth.signOut({ scope: "local" });
      return { status: "invalid", reason: "user_not_found" };
    }
    return { status: "no_session" };
  }

  return { status: "ready" };
}

export async function clearInvalidLocalSession(): Promise<void> {
  await supabase.auth.signOut({ scope: "local" });
}

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
