import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/callback", "/reset-password"] as const;
const PROTECTED_ROUTES = ["/dashboard", "/profile"] as const;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoggedIn = request.cookies.has("auth_session");
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = ["/login", "/register"].includes(pathname);

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
