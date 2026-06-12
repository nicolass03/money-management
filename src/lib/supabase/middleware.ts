import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth");

  if (!isAuthenticated && !isLoginPage && !isAuthApi) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/expenses", request.url));
  }

  return response;
}
