import { redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase/client";

export async function requireAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw redirect({ to: "/login" });
  }

  return session;
}

export async function redirectIfAuthenticated() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    throw redirect({ to: "/expenses" });
  }
}
