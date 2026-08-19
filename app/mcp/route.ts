import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyApiKey } from "@/lib/auth";
import { registerTools } from "@/lib/mcp/tools";
import { withAccessLogging } from "@/lib/logging";

/**
 * Dedicated handler for Gemini (and any other client configured to hit /mcp natively).
 * Configured with basePath: "" so it matches requests to exactly /mcp.
 */
const handler = createMcpHandler(
  (server) => {
    registerTools(server);
  },
  {},
  {
    basePath: "",
    streamableHttpEndpoint: "/mcp",
    disableSse: true, // Gemini is StreamableHTTP-only; SSE needs REDIS_URL and would 500
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== "production",
  },
);

const authHandler = withMcpAuth(handler, verifyApiKey, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

const loggedHandler = withAccessLogging(authHandler);

export { loggedHandler as GET, loggedHandler as POST, loggedHandler as DELETE };
