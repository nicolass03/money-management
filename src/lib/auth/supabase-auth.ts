import { emailsMatch, getAuthUserEmail } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithSupabasePassword(
  password: string,
): Promise<boolean> {
  const email = getAuthUserEmail();
  if (!email || !password) {
    return false;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return !error && emailsMatch(data.user?.email, email);
}
