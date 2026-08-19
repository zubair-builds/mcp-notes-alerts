import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";
import { db } from "../db";
import { mcpCalls } from "../db/schema";

/**
 * The second argument every registerTool callback receives. `authInfo` is
 * populated by withMcpAuth (app/api/[transport]/route.ts) from whatever
 * verifyApiKey (lib/auth.ts) returned -- that's where `extra.apiKeyId`
 * comes from.
 */
export type ToolCtx = RequestHandlerExtra<ServerRequest, ServerNotification>;

export function getApiKeyId(ctx: ToolCtx | undefined): string | undefined {
  const authInfo = ctx?.authInfo as { clientId?: string; extra?: { apiKeyId?: string } } | undefined;
  const id = authInfo?.extra?.apiKeyId ?? authInfo?.clientId;
  return id === "mock" ? undefined : id;
}

/**
 * Wraps a tool's execute function so every call -- success or failure --
 * is logged to mcp_calls with its latency and the caller's api key. This
 * is what the dashboard's calls-per-day chart, top-tools list, and error
 * rate are computed from.
 *
 * `fn` receives the resolved apiKeyId as its second argument so tool
 * bodies can scope their DB queries without touching ctx themselves.
 */
export function withLogging<Args, Result>(
  toolName: string,
  fn: (args: Args, apiKeyId: string | undefined) => Promise<Result>,
) {
  return async (args: Args, ctx: ToolCtx | undefined): Promise<Result> => {
    const apiKeyId = getApiKeyId(ctx);
    const start = Date.now();
    try {
      const result = await fn(args, apiKeyId);
      await logCall({ toolName, apiKeyId, args, status: "success", latencyMs: Date.now() - start });
      return result;
    } catch (err) {
      await logCall({
        toolName,
        apiKeyId,
        args,
        status: "error",
        latencyMs: Date.now() - start,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  };
}

async function logCall(entry: {
  toolName: string;
  apiKeyId: string | undefined;
  args: unknown;
  status: "success" | "error";
  latencyMs: number;
  errorMessage?: string;
}) {
  try {
    await db.insert(mcpCalls).values({
      toolName: entry.toolName,
      apiKeyId: entry.apiKeyId ?? null,
      args: entry.args as object,
      status: entry.status,
      latencyMs: entry.latencyMs,
      errorMessage: entry.errorMessage,
    });
  } catch {
    // Logging must never break the actual tool call. Swallow errors here;
    // if you need to debug missing logs, temporarily console.error instead.
  }
}
