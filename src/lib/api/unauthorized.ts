let handler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void): void {
  handler = fn;
}

export function triggerUnauthorized(): void {
  handler?.();
}
