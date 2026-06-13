export interface FormResult {
  error?: string;
  success?: boolean;
}

export function mutationError(error: unknown, fallback: string): FormResult {
  if (error instanceof Error) {
    return { error: error.message || fallback };
  }
  return { error: fallback };
}
