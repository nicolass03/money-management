import { createClient } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/env";

export const supabase = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Implicit flow (JS default for client-only SPAs). Dashboard invites do not
    // support PKCE — see supabase.com/docs/reference/python/auth-admin-inviteuserbyemail
    detectSessionInUrl: true,
  },
});
