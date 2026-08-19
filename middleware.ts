import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionCookieValue, SESSION_COOKIE_NAME } from "./lib/session";

export async function middleware(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!(await isValidSessionCookieValue(cookie))) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/keys/:path*"],
};
