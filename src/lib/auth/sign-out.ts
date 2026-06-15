import { clearAppDataCache } from "@/lib/query/query-client";
import { clearPasswordFlow } from "@/lib/auth/password-flow";
import { supabase } from "@/lib/supabase/client";

/** Last-resort wipe if `signOut` returns an error without clearing storage. */
function purgeSupabaseAuthStorage(): void {
  if (typeof window === "undefined") return;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith("sb-") && key.endsWith("-auth-token")) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * End the current browser session and drop all cached user data.
 * Uses `scope: 'local'` (Supabase recommended for single-tab logout).
 */
export async function performSignOut(): Promise<void> {
  clearPasswordFlow();
  await clearAppDataCache();

  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    purgeSupabaseAuthStorage();
  }
}
