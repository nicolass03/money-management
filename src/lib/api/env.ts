export function getApiUrl(): string {
  const url = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      "API_URL (or NEXT_PUBLIC_API_URL) is missing from .env. Point it at the Rust API base URL.",
    );
  }
  return url.replace(/\/$/, "");
}
