import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/index";
import type { DbClient } from "@/lib/db/client";
import {
  budgetTags,
  expenseTags,
  plannedExpenseTags,
  recurringExpenseTags,
  tags,
} from "@/lib/db/schema";

export { formatTagNames, parseTagNames } from "./tag-utils";

async function ensureTags(names: string[], dbClient: DbClient = db): Promise<number[]> {
  if (names.length === 0) {
    return [];
  }

  const now = new Date().toISOString();

  await dbClient
    .insert(tags)
    .values(names.map((name) => ({ name, createdAt: now })))
    .onConflictDoNothing({ target: tags.name });

  const rows = await dbClient
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(inArray(tags.name, names));

  const nameToId = new Map(rows.map((row) => [row.name, row.id]));
  return names.map((name) => {
    const id = nameToId.get(name);
    if (id === undefined) {
      throw new Error(`tag not found after upsert: ${name}`);
    }
    return id;
  });
}

export async function setExpenseTags(
  expenseId: number,
  tagNames: string[],
  dbClient: DbClient = db,
) {
  await dbClient.delete(expenseTags).where(eq(expenseTags.expenseId, expenseId));

  const tagIds = await ensureTags(tagNames, dbClient);
  if (tagIds.length === 0) {
    return;
  }

  await dbClient.insert(expenseTags).values(
    tagIds.map((tagId) => ({
      expenseId,
      tagId,
    })),
  );
}

export async function setPlannedExpenseTags(
  plannedExpenseId: number,
  tagNames: string[],
  dbClient: DbClient = db,
) {
  await dbClient
    .delete(plannedExpenseTags)
    .where(eq(plannedExpenseTags.plannedExpenseId, plannedExpenseId));

  const tagIds = await ensureTags(tagNames, dbClient);
  if (tagIds.length === 0) {
    return;
  }

  await dbClient.insert(plannedExpenseTags).values(
    tagIds.map((tagId) => ({
      plannedExpenseId,
      tagId,
    })),
  );
}

export async function setBudgetTags(
  budgetId: number,
  tagNames: string[],
  dbClient: DbClient = db,
) {
  await dbClient.delete(budgetTags).where(eq(budgetTags.budgetId, budgetId));

  const tagIds = await ensureTags(tagNames, dbClient);
  if (tagIds.length === 0) {
    return;
  }

  await dbClient.insert(budgetTags).values(
    tagIds.map((tagId) => ({
      budgetId,
      tagId,
    })),
  );
}

export async function copyBudgetTagsToExpense(
  budgetId: number,
  expenseId: number,
  dbClient: DbClient = db,
) {
  const links = await dbClient
    .select({ tagId: budgetTags.tagId })
    .from(budgetTags)
    .where(eq(budgetTags.budgetId, budgetId));

  if (links.length === 0) {
    return;
  }

  await dbClient.insert(expenseTags).values(
    links.map((link) => ({
      expenseId,
      tagId: link.tagId,
    })),
  );
}

export async function setRecurringExpenseTags(
  recurringExpenseId: number,
  tagNames: string[],
  dbClient: DbClient = db,
) {
  await dbClient
    .delete(recurringExpenseTags)
    .where(eq(recurringExpenseTags.recurringExpenseId, recurringExpenseId));

  const tagIds = await ensureTags(tagNames, dbClient);
  if (tagIds.length === 0) {
    return;
  }

  await dbClient.insert(recurringExpenseTags).values(
    tagIds.map((tagId) => ({
      recurringExpenseId,
      tagId,
    })),
  );
}

export async function copyRecurringTagsToExpense(
  recurringExpenseId: number,
  expenseId: number,
  dbClient: DbClient = db,
) {
  const links = await dbClient
    .select({ tagId: recurringExpenseTags.tagId })
    .from(recurringExpenseTags)
    .where(eq(recurringExpenseTags.recurringExpenseId, recurringExpenseId));

  if (links.length === 0) {
    return;
  }

  await dbClient.insert(expenseTags).values(
    links.map((link) => ({
      expenseId,
      tagId: link.tagId,
    })),
  );
}

export async function copyPlannedTagsToExpense(
  plannedExpenseId: number,
  expenseId: number,
  dbClient: DbClient = db,
) {
  const links = await dbClient
    .select({ tagId: plannedExpenseTags.tagId })
    .from(plannedExpenseTags)
    .where(eq(plannedExpenseTags.plannedExpenseId, plannedExpenseId));

  if (links.length === 0) {
    return;
  }

  await dbClient.insert(expenseTags).values(
    links.map((link) => ({
      expenseId,
      tagId: link.tagId,
    })),
  );
}

async function getTagNamesByExpenseIds(
  expenseIds: number[],
  dbClient: DbClient = db,
): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (expenseIds.length === 0) {
    return map;
  }

  const rows = await dbClient
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
  dbClient: DbClient = db,
): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (plannedIds.length === 0) {
    return map;
  }

  const rows = await dbClient
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
  dbClient: DbClient = db,
): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (recurringIds.length === 0) {
    return map;
  }

  const rows = await dbClient
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

async function getTagNamesByBudgetIds(
  budgetIds: number[],
  dbClient: DbClient = db,
): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (budgetIds.length === 0) {
    return map;
  }

  const rows = await dbClient
    .select({
      budgetId: budgetTags.budgetId,
      tagName: tags.name,
    })
    .from(budgetTags)
    .innerJoin(tags, eq(budgetTags.tagId, tags.id))
    .where(inArray(budgetTags.budgetId, budgetIds));

  for (const row of rows) {
    const existing = map.get(row.budgetId) ?? [];
    existing.push(row.tagName);
    map.set(row.budgetId, existing);
  }

  for (const id of budgetIds) {
    if (!map.has(id)) {
      map.set(id, []);
    }
  }

  return map;
}

export async function attachTagsToBudgets<T extends { id: number }>(
  items: T[],
): Promise<Array<T & { tags: string[] }>> {
  const tagMap = await getTagNamesByBudgetIds(items.map((item) => item.id));
  return items.map((item) => ({
    ...item,
    tags: tagMap.get(item.id) ?? [],
  }));
}

export async function getAllTagNames(): Promise<string[]> {
  const rows = await db.select({ name: tags.name }).from(tags).orderBy(tags.name);
  return rows.map((row) => row.name);
}
