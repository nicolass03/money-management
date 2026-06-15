import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, Session } from "@supabase/supabase-js";
import { completeOnboarding } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setOnboardingRequiredHandler } from "@/lib/api/onboarding-required";
import { setUnauthorizedHandler } from "@/lib/api/unauthorized";
import { canAccessApp, clearInvalidLocalSession } from "@/lib/auth/auth-flow";
import {
  clearPasswordFlow,
  setPasswordFlow,
} from "@/lib/auth/password-flow";
import { performSignOut } from "@/lib/auth/sign-out";
import { clearAppDataCache } from "@/lib/query/query-client";
import { supabase } from "@/lib/supabase/client";

export type AuthErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "rate_limited"
  | "network"
  | "unknown";

export type PasswordUpdateErrorCode =
  | "password_too_short"
  | "onboarding_failed"
  | "session_invalid"
  | "unknown";

function mapSignInError(error: AuthError): AuthErrorCode {
  const message = error.message.toLowerCase();
  if (message.includes("invalid login credentials")) {
    return "invalid_credentials";
  }
  if (message.includes("email not confirmed")) {
    return "email_not_confirmed";
  }
  if (message.includes("rate limit") || error.status === 429) {
    return "rate_limited";
  }
  if (message.includes("fetch") || message.includes("network")) {
    return "network";
  }
  return "unknown";
}

interface SessionContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  canAccessApp: boolean;
  isBootstrapping: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error?: AuthErrorCode }>;
  signOut: () => Promise<void>;
  updatePassword: (
    password: string,
  ) => Promise<{ error?: PasswordUpdateErrorCode }>;
  resetPasswordForEmail: (email: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const signOut = useCallback(async () => {
    await performSignOut();
    setSession(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    setOnboardingRequiredHandler(() => {
      if (typeof window === "undefined") return;
      if (window.location.pathname.startsWith("/set-password")) return;
      window.location.assign("/set-password");
    });
  }, [signOut]);

  useEffect(() => {
    let mounted = true;
    let previousUserId: string | null = null;

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (mounted) {
        previousUserId = initial?.user?.id ?? null;
        setSession(initial);
        setIsBootstrapping(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const nextUserId = nextSession?.user?.id ?? null;

      if (event === "SIGNED_OUT") {
        previousUserId = null;
        setSession(null);
        setIsBootstrapping(false);
        void clearAppDataCache();
        return;
      }

      if (
        event === "SIGNED_IN" &&
        previousUserId &&
        nextUserId &&
        previousUserId !== nextUserId
      ) {
        void clearAppDataCache();
      }

      previousUserId = nextUserId;
      setSession(nextSession);
      setIsBootstrapping(false);

      if (
        event === "PASSWORD_RECOVERY" &&
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/set-password")
      ) {
        setPasswordFlow("recovery");
        window.location.assign("/set-password");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      return { error: mapSignInError(error) };
    }
    await clearAppDataCache();
    return {};
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (password.length < 8) {
      return { error: "password_too_short" as const };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      const message = userError?.message?.toLowerCase() ?? "";
      const code = userError?.code;
      if (
        code === "user_not_found" ||
        message.includes("user from sub claim") ||
        message.includes("user not found")
      ) {
        await clearInvalidLocalSession();
        return { error: "session_invalid" as const };
      }
      return { error: "unknown" as const };
    }

    const { error } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (
        error.code === "user_not_found" ||
        message.includes("user from sub claim")
      ) {
        await clearInvalidLocalSession();
        return { error: "session_invalid" as const };
      }
      return { error: "unknown" as const };
    }

    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      return { error: "onboarding_failed" as const };
    }

    try {
      await completeOnboarding();
    } catch (caught) {
      if (
        caught instanceof ApiError &&
        caught.status === 400 &&
        caught.message.includes("password must be set")
      ) {
        return { error: "onboarding_failed" as const };
      }
      return { error: "onboarding_failed" as const };
    }

    clearPasswordFlow();
    return {};
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const redirectTo = `${window.location.origin}/set-password`;
    await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isAuthenticated: !!session?.access_token,
      canAccessApp: canAccessApp(session),
      isBootstrapping,
      signIn,
      signOut,
      updatePassword,
      resetPasswordForEmail,
    }),
    [session, isBootstrapping, signIn, signOut, updatePassword, resetPasswordForEmail],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
