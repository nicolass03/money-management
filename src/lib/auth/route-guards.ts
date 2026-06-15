import { redirect } from "@tanstack/react-router";
import {
  getAuthCallbackType,
  isPasswordSetupFlow,
  needsPasswordSetup,
} from "@/lib/auth/auth-flow";
import { supabase } from "@/lib/supabase/client";

export async function requireAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw redirect({ to: "/login" });
  }

  if (needsPasswordSetup(session)) {
    throw redirect({ to: "/set-password" });
  }

  return session;
}

export async function redirectIfAuthenticated() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return;

  const callbackType = getAuthCallbackType();
  if (isPasswordSetupFlow(callbackType) || needsPasswordSetup(session)) {
    throw redirect({ to: "/set-password" });
  }

  throw redirect({ to: "/expenses" });
}
