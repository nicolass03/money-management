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

/** The comma-delimited segment `[start, end)` holding `caret`, and its normalized text. */
export function tagTokenAt(value: string, caret: number) {
  const start = value.slice(0, caret).lastIndexOf(",") + 1;
  const comma = value.indexOf(",", caret);
  const end = comma === -1 ? value.length : comma;
  return { start, end, query: value.slice(start, end).trim().toLowerCase() };
}

/** Tags containing `query` that aren't `taken`: prefix matches first, input order kept within each group. */
export function suggestTags(
  allTags: string[],
  query: string,
  taken: Set<string>,
  limit = 8,
): string[] {
  if (!query) {
    return [];
  }
  const prefix: string[] = [];
  const infix: string[] = [];
  for (const tag of allTags) {
    if (taken.has(tag)) {
      continue;
    }
    if (tag.startsWith(query)) {
      prefix.push(tag);
    } else if (tag.includes(query)) {
      infix.push(tag);
    }
  }
  return [...prefix, ...infix].slice(0, limit);
}
