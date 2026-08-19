import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  let body: Record<string, string> = {};

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    body = Object.fromEntries(params);
  } else if (contentType.includes("application/json")) {
    body = await req.json();
  }

  // Return our hardcoded mock access token regardless of grant_type
  return NextResponse.json({
    access_token: "mcp_live_mock_token_9999",
    token_type: "Bearer",
    expires_in: 31536000, // 1 year
    refresh_token: "mock_refresh_token_12345"
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    }
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
