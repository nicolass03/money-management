export function getSupabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) is missing from .env",
    );
  }
  return url;
}

/** Low-privilege key (`sb_publishable_...`) for SSR, middleware, and auth. */
export function getSupabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or SUPABASE_PUBLISHABLE_KEY) is missing from .env. " +
        "Create one in Supabase Dashboard → Settings → API Keys.",
    );
  }
  return key;
}

export function getAuthUserEmail(): string | undefined {
  const email = process.env.AUTH_USER_EMAIL?.trim().toLowerCase();
  return email || undefined;
}

export function emailsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
