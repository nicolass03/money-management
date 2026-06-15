let handler: (() => void) | null = null;

export function setOnboardingRequiredHandler(fn: () => void): void {
  handler = fn;
}

export function triggerOnboardingRequired(): void {
  handler?.();
}
