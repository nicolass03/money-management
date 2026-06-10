import { NextResponse } from "next/server";
import { signInWithSupabasePassword } from "@/lib/auth/supabase-auth";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const isValid = await signInWithSupabasePassword(password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true });
}
