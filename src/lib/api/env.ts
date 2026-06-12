import "server-only";

export function getApiUrl(): string {
  const url = process.env.API_URL;
  if (!url) {
    throw new Error(
      "API_URL is missing from .env. Point it at the Rust API base URL.",
    );
  }
  return url.replace(/\/$/, "");
}
