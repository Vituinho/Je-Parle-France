import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirects only (cookie presence). Real authorisation happens in
 * the Data Access Layer (src/server/session.ts) on every request.
 */
const AUTH_PAGES = ["/entrar", "/cadastro"];
const PUBLIC_PAGES = ["/", ...AUTH_PAGES];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Static files (anything with an extension) never need a session.
  if (pathname.includes(".")) return NextResponse.next();
  const hasSession = Boolean(getSessionCookie(request));

  if (hasSession && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/hoje", request.url));
  }
  if (!hasSession && !PUBLIC_PAGES.includes(pathname)) {
    const url = new URL("/entrar", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
