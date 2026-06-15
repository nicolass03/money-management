import type { EmailOtpType, Session } from "@supabase/supabase-js";
import { getPasswordFlow, setPasswordFlow } from "@/lib/auth/password-flow";
import { supabase } from "@/lib/supabase/client";

export type AuthCallbackType = "invite" | "recovery" | "signup" | "email" | null;

export type EstablishSessionResult =
  | { status: "ready"; session: Session; passwordSetup: boolean }
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

/** True when the current URL still carries Supabase auth callback parameters. */
export function hasAuthParamsInUrl(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);

  return (
    params.has("code") ||
    params.has("token_hash") ||
    hashParams.has("access_token") ||
    hashParams.get("type") === "invite" ||
    hashParams.get("type") === "recovery" ||
    params.get("type") === "invite" ||
    params.get("type") === "recovery"
  );
}

/**
 * Wait for detectSessionInUrl / onAuthStateChange after an email redirect.
 * Docs: implicit flow puts tokens in the URL hash; recovery fires PASSWORD_RECOVERY.
 */
async function waitForAuthSession(
  timeoutMs = 8000,
  options?: { skipCachedSession?: boolean },
): Promise<Session | null> {
  const skipCached = options?.skipCachedSession ?? false;

  if (!skipCached) {
    const initial = await supabase.auth.getSession();
    if (initial.data.session) {
      const userResult = await supabase.auth.getUser();
      if (!userResult.error && userResult.data.user) {
        return initial.data.session;
      }
    }
  }

  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      subscription.unsubscribe();
      void supabase.auth.getSession().then(({ data }) => {
        resolve(data.session);
      });
    }, timeoutMs);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (settled || !session) return;
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "PASSWORD_RECOVERY"
      ) {
        settled = true;
        clearTimeout(timer);
        subscription.unsubscribe();
        resolve(session);
      }
    });
  });
}

async function clearStaleSessionIfInvalid(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const userResult = await supabase.auth.getUser();
  if (
    userResult.error &&
    isUserNotFoundError(userResult.error.message, userResult.error.code)
  ) {
    await supabase.auth.signOut({ scope: "local" });
  }
}

function resolvePasswordSetup(
  session: Session,
  callbackType: AuthCallbackType,
  typeParam: string | null,
): boolean {
  return (
    needsPasswordSetup(session) ||
    isPasswordSetupFlow(callbackType) ||
    typeParam === "invite" ||
    typeParam === "recovery" ||
    getPasswordFlow() === "recovery"
  );
}

/**
 * Resolve the session for invite/recovery landing pages.
 *
 * Dashboard invites use implicit flow (not PKCE) — tokens arrive in the URL
 * hash or via verifyOtp(token_hash, type) for custom email templates.
 * See: supabase.com/docs/reference/python/auth-admin-inviteuserbyemail
 *      supabase.com/docs/guides/auth/auth-email-templates
 */
export async function establishAuthSessionFromUrl(): Promise<EstablishSessionResult> {
  const hadAuthParams = hasAuthParamsInUrl();
  const callbackType = getAuthCallbackType();
  const params = new URLSearchParams(window.location.search);
  const authError = params.get("error_description") ?? params.get("error");
  const typeParam = params.get("type");

  if (authError) {
    clearAuthParamsFromUrl();
    return { status: "invalid", reason: "callback_failed" };
  }

  const tokenHash = params.get("token_hash");
  let verifiedViaOtp = false;

  if (tokenHash && typeParam) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeParam as EmailOtpType,
    });
    if (error || !data.session) {
      clearAuthParamsFromUrl();
      return { status: "invalid", reason: "callback_failed" };
    }
    verifiedViaOtp = true;
  } else if (hadAuthParams) {
    await clearStaleSessionIfInvalid();
    await waitForAuthSession(8000, { skipCachedSession: true });
  }

  let session = (await supabase.auth.getSession()).data.session;
  if (!session && hadAuthParams && !verifiedViaOtp) {
    session = await waitForAuthSession(8000, { skipCachedSession: true });
  }

  if (!session) {
    return hadAuthParams
      ? { status: "invalid", reason: "callback_failed" }
      : { status: "no_session" };
  }

  const userResult = await supabase.auth.getUser();
  if (userResult.error || !userResult.data.user) {
    if (
      userResult.error &&
      isUserNotFoundError(userResult.error.message, userResult.error.code)
    ) {
      await supabase.auth.signOut({ scope: "local" });
      return { status: "invalid", reason: "user_not_found" };
    }
    return hadAuthParams
      ? { status: "invalid", reason: "callback_failed" }
      : { status: "no_session" };
  }

  const verifiedSession =
    (await supabase.auth.getSession()).data.session ?? session;

  const passwordSetup = resolvePasswordSetup(
    verifiedSession,
    callbackType,
    typeParam,
  );

  if (callbackType === "recovery" || typeParam === "recovery") {
    setPasswordFlow("recovery");
  }

  clearAuthParamsFromUrl();
  return { status: "ready", session: verifiedSession, passwordSetup };
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
  url.searchParams.delete("token_hash");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  window.history.replaceState({}, "", url.pathname + url.search);
}
