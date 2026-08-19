import { protectedResourceHandler, getPublicOrigin, metadataCorsOptionsRequestHandler } from "mcp-handler";
import type { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const origin = getPublicOrigin(req);
  const handler = protectedResourceHandler({
    authServerUrls: [origin],
  });
  return handler(req);
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
