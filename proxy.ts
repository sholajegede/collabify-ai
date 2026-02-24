// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/org");

  const sessionCookie =
    request.cookies.get("kinde_token") ??
    request.cookies.get("kinde-token") ??
    request.cookies.get("id_token");

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/org/:path*"],
};