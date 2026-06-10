/** Replace digits with bullets while preserving currency formatting. */
export function maskNumericValue(text: string): string {
  return text.replace(/\d/g, "•");
}
