import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/callback", "/reset-password"] as const;
const PROTECTED_ROUTES = ["/dashboard", "/profile"] as const;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoggedIn =
    request.cookies.has(
      process.env.ACCESS_TOKEN_COOKIE_NAME || "access_token",
    ) ||
    request.cookies.has(
      process.env.REFRESH_TOKEN_COOKIE_NAME || "refresh_token",
    );
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
