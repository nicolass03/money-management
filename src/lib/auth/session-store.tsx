import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { setUnauthorizedHandler } from "@/lib/api/unauthorized";
import { supabase } from "@/lib/supabase/client";

interface SessionContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
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
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsBootstrapping(false);
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
      return { error: "invalid credentials" };
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
    }),
    [session, isBootstrapping, signIn, signOut],
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
