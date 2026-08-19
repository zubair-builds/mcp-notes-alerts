import { protectedResourceHandler, getPublicOrigin, metadataCorsOptionsRequestHandler } from "mcp-handler";
import type { NextRequest } from "next/server";
import { withAccessLogging } from "@/lib/logging";

function getHandler(req: NextRequest) {
  const origin = getPublicOrigin(req);
  const handler = protectedResourceHandler({
    authServerUrls: [origin],
    resourceUrl: `${origin}/mcp`,
  });
  return handler(req);
}

export const GET = withAccessLogging(getHandler);

export const OPTIONS = withAccessLogging(metadataCorsOptionsRequestHandler());
