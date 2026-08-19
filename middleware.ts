import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionCookieValue, SESSION_COOKIE_NAME } from "./lib/session";

export async function middleware(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  const isValid = cookie ? await isValidSessionCookieValue(cookie.value) : false;

  if (!isValid) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/keys/:path*"],
};
