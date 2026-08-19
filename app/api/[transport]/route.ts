import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyApiKey } from "@/lib/auth";
import { registerTools } from "@/lib/mcp/tools";

/**
 * This single dynamic route serves BOTH transports mcp-handler v1
 * supports, keyed by the [transport] segment:
 *   - POST /api/mcp   -> Streamable HTTP (current MCP spec)
 *   - GET  /api/sse    -> SSE (older transport, still what claude.ai's
 *                          "remote connectors" UI speaks as of this
 *                          writing -- keep this around even after most
 *                          clients move to Streamable HTTP)
 *
 * Point Claude Code / the API at https://<your-domain>/api/mcp and
 * claude.ai's connector UI at https://<your-domain>/api/sse, both with
 * the API key pasted in as a bearer token.
 */
const handler = createMcpHandler(
  (server) => {
    // Tools pull the caller's api key id off the per-request auth
    // context (attached by withMcpAuth below) rather than a closure
    // variable here -- see lib/mcp/logging.ts's withLogging.
    registerTools(server);
  },
  {},
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== "production",
  },
);

const authHandler = withMcpAuth(handler, verifyApiKey, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
