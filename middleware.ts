import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionCookieValue, SESSION_COOKIE_NAME } from "./lib/session";

export async function middleware(req: NextRequest) {
  // BYPASS PASSWORD: Always allow access
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/keys/:path*"],
};
