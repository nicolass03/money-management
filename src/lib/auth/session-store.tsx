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
import { setUnauthorizedHandler } from "@/lib/api/unauthorized";
import { supabase } from "@/lib/supabase/client";

export type AuthErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "rate_limited"
  | "network"
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
  isBootstrapping: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error?: AuthErrorCode }>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  resetPasswordForEmail: (email: string) => Promise<{ error?: string }>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
  }, [signOut]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (mounted) {
        setSession(initial);
        setIsBootstrapping(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setIsBootstrapping(false);

      if (
        event === "PASSWORD_RECOVERY" &&
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/set-password")
      ) {
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
    return {};
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    });
    if (error) {
      return { error: error.message };
    }
    return {};
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const redirectTo = `${window.location.origin}/set-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo },
    );
    if (error) {
      return { error: error.message };
    }
    return {};
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isAuthenticated: !!session?.access_token,
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
