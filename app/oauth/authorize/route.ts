import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const redirectUri = searchParams.get("redirect_uri");
  const state = searchParams.get("state");

  if (!redirectUri) {
    return new Response("Missing redirect_uri", { status: 400 });
  }

  // Generate a mock authorization code
  const mockCode = "mock_auth_code_12345";

  // Redirect back to the client with the code and state
  const url = new URL(redirectUri);
  url.searchParams.set("code", mockCode);
  if (state) {
    url.searchParams.set("state", state);
  }

  return NextResponse.redirect(url);
}
