import { NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/evaluatees",
  "/api/evaluations",
];

function isProtected(pathname) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth/login") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("token")?.value);

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtected(pathname) && !hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
