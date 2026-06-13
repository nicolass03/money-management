export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error("VITE_SUPABASE_URL is missing from .env");
  }
  return url;
}

export function getSupabasePublishableKey(): string {
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      "VITE_SUPABASE_PUBLISHABLE_KEY is missing from .env. " +
        "Create one in Supabase Dashboard → Settings → API Keys.",
    );
  }
  return key;
}

export function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    throw new Error("VITE_API_URL is missing from .env");
  }
  return url.replace(/\/$/, "");
}
