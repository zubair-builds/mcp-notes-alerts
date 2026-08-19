import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionCookieValue, SESSION_COOKIE_NAME } from "./lib/session";

export async function middleware(req: NextRequest) {
  // Handle clean /mcp URL routing based on method
  if (req.nextUrl.pathname === "/mcp") {
    if (req.method === "GET") {
      return NextResponse.rewrite(new URL("/api/sse", req.url));
    } else {
      return NextResponse.rewrite(new URL("/api/mcp", req.url));
    }
  }

  // BYPASS PASSWORD: Always allow access
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/keys/:path*", "/mcp"],
};
