import { NextResponse } from "next/server";
import { isSameOriginAuthFetch } from "@/lib/auth/csrf";
import { getClientIp, isLoginRateLimited } from "@/lib/auth/rate-limit";
import { signInWithSupabasePassword } from "@/lib/auth/supabase-auth";

export async function POST(request: Request) {
  if (!isSameOriginAuthFetch(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientIp = getClientIp(request);
  if (isLoginRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const emailKey = String(email).trim().toLowerCase();
  if (isLoginRateLimited(`email:${emailKey}`)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  const isValid = await signInWithSupabasePassword(email, password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true });
}
