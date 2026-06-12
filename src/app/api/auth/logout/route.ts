import { NextResponse } from "next/server";
import { isSameOriginAuthFetch } from "@/lib/auth/csrf";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSameOriginAuthFetch(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
