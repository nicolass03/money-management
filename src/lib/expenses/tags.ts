import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/index";
import {
  expenseTags,
  plannedExpenseTags,
  recurringExpenseTags,
  tags,
} from "@/lib/db/schema";

export { formatTagNames, parseTagNames } from "./tag-utils";

async function ensureTags(names: string[]): Promise<number[]> {
  if (names.length === 0) {
    return [];
  }

  const now = new Date().toISOString();
  const tagIds: number[] = [];

  for (const name of names) {
    const [existing] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, name));

    if (existing) {
      tagIds.push(existing.id);
      continue;
    }

    const [created] = await db
      .insert(tags)
      .values({ name, createdAt: now })
      .returning();
    tagIds.push(created.id);
  }

  return tagIds;
}

export async function setExpenseTags(expenseId: number, tagNames: string[]) {
  await db.delete(expenseTags).where(eq(expenseTags.expenseId, expenseId));

  const tagIds = await ensureTags(tagNames);
  if (tagIds.length === 0) {
    return;
  }

  await db.insert(expenseTags).values(
    tagIds.map((tagId) => ({
      expenseId,
      tagId,
    })),
  );
}

export async function setPlannedExpenseTags(
  plannedExpenseId: number,
  tagNames: string[],
) {
  await db
    .delete(plannedExpenseTags)
    .where(eq(plannedExpenseTags.plannedExpenseId, plannedExpenseId));

  const tagIds = await ensureTags(tagNames);
  if (tagIds.length === 0) {
    return;
  }

  await db.insert(plannedExpenseTags).values(
    tagIds.map((tagId) => ({
      plannedExpenseId,
      tagId,
    })),
  );
}

export async function setRecurringExpenseTags(
  recurringExpenseId: number,
  tagNames: string[],
) {
  await db
    .delete(recurringExpenseTags)
    .where(eq(recurringExpenseTags.recurringExpenseId, recurringExpenseId));

  const tagIds = await ensureTags(tagNames);
  if (tagIds.length === 0) {
    return;
  }

  await db.insert(recurringExpenseTags).values(
    tagIds.map((tagId) => ({
      recurringExpenseId,
      tagId,
    })),
  );
}

export async function copyRecurringTagsToExpense(
  recurringExpenseId: number,
  expenseId: number,
) {
  const links = await db
    .select({ tagId: recurringExpenseTags.tagId })
    .from(recurringExpenseTags)
    .where(eq(recurringExpenseTags.recurringExpenseId, recurringExpenseId));

  if (links.length === 0) {
    return;
  }

  await db.insert(expenseTags).values(
    links.map((link) => ({
      expenseId,
      tagId: link.tagId,
    })),
  );
}

async function getTagNamesByExpenseIds(
  expenseIds: number[],
): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (expenseIds.length === 0) {
    return map;
  }

  const rows = await db
    .select({
      expenseId: expenseTags.expenseId,
      tagName: tags.name,
    })
    .from(expenseTags)
    .innerJoin(tags, eq(expenseTags.tagId, tags.id))
    .where(inArray(expenseTags.expenseId, expenseIds));

  for (const row of rows) {
    const existing = map.get(row.expenseId) ?? [];
    existing.push(row.tagName);
    map.set(row.expenseId, existing);
  }

  for (const id of expenseIds) {
    if (!map.has(id)) {
      map.set(id, []);
    }
  }

  return map;
}

async function getTagNamesByPlannedIds(
  plannedIds: number[],
): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (plannedIds.length === 0) {
    return map;
  }

  const rows = await db
    .select({
      plannedExpenseId: plannedExpenseTags.plannedExpenseId,
      tagName: tags.name,
    })
    .from(plannedExpenseTags)
    .innerJoin(tags, eq(plannedExpenseTags.tagId, tags.id))
    .where(inArray(plannedExpenseTags.plannedExpenseId, plannedIds));

  for (const row of rows) {
    const existing = map.get(row.plannedExpenseId) ?? [];
    existing.push(row.tagName);
    map.set(row.plannedExpenseId, existing);
  }

  for (const id of plannedIds) {
    if (!map.has(id)) {
      map.set(id, []);
    }
  }

  return map;
}

async function getTagNamesByRecurringIds(
  recurringIds: number[],
): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (recurringIds.length === 0) {
    return map;
  }

  const rows = await db
    .select({
      recurringExpenseId: recurringExpenseTags.recurringExpenseId,
      tagName: tags.name,
    })
    .from(recurringExpenseTags)
    .innerJoin(tags, eq(recurringExpenseTags.tagId, tags.id))
    .where(inArray(recurringExpenseTags.recurringExpenseId, recurringIds));

  for (const row of rows) {
    const existing = map.get(row.recurringExpenseId) ?? [];
    existing.push(row.tagName);
    map.set(row.recurringExpenseId, existing);
  }

  for (const id of recurringIds) {
    if (!map.has(id)) {
      map.set(id, []);
    }
  }

  return map;
}

export async function attachTagsToExpenses<T extends { id: number }>(
  items: T[],
): Promise<Array<T & { tags: string[] }>> {
  const tagMap = await getTagNamesByExpenseIds(items.map((item) => item.id));
  return items.map((item) => ({
    ...item,
    tags: tagMap.get(item.id) ?? [],
  }));
}

export async function attachTagsToRecurringExpenses<T extends { id: number }>(
  items: T[],
): Promise<Array<T & { tags: string[] }>> {
  const tagMap = await getTagNamesByRecurringIds(items.map((item) => item.id));
  return items.map((item) => ({
    ...item,
    tags: tagMap.get(item.id) ?? [],
  }));
}

export async function attachTagsToPlannedExpenses<T extends { id: number }>(
  items: T[],
): Promise<Array<T & { tags: string[] }>> {
  const tagMap = await getTagNamesByPlannedIds(items.map((item) => item.id));
  return items.map((item) => ({
    ...item,
    tags: tagMap.get(item.id) ?? [],
  }));
}

export async function getAllTagNames(): Promise<string[]> {
  const rows = await db.select({ name: tags.name }).from(tags).orderBy(tags.name);
  return rows.map((row) => row.name);
}
