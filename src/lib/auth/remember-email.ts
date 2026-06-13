const STORAGE_KEY = "incm-mgmt-remembered-email";

export function getRememberedEmail(): string | null {
  if (typeof window === "undefined") return null;
  const email = localStorage.getItem(STORAGE_KEY)?.trim().toLowerCase();
  return email || null;
}

export function setRememberedEmail(email: string): void {
  localStorage.setItem(STORAGE_KEY, email.trim().toLowerCase());
}

export function clearRememberedEmail(): void {
  localStorage.removeItem(STORAGE_KEY);
}
