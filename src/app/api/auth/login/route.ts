import { NextResponse } from "next/server";
import { signInWithSupabasePassword } from "@/lib/auth/supabase-auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
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
