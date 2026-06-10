import { NextResponse } from "next/server";
import { chargeDueExpensesForDate } from "@/lib/expenses/charge-due-expenses";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const date = new Date().toISOString().slice(0, 10);

  try {
    const result = await chargeDueExpensesForDate(date);
    return NextResponse.json({ date, ...result });
  } catch {
    return NextResponse.json({ error: "failed to charge expenses" }, { status: 500 });
  }
}
