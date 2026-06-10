export function parseTagNames(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of input.split(",")) {
    const name = part.trim().toLowerCase();
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    result.push(name);
  }

  return result;
}

export function formatTagNames(tagNames: string[]): string {
  return tagNames.join(", ");
}
