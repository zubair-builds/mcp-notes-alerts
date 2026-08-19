import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { alerts as alertsTable, apiKeys, mcpCalls, notes } from "../db/schema";
import { withLogging } from "./logging";
import { alertConditionSchema } from "./alerts";

export const MCP_SERVER_INFO = {
  name: "Notify",
  version: "0.1.0",
};

/**
 * Registers every tool this MCP server exposes. Each tool is wrapped in
 * withLogging, which pulls the caller's api key id off the per-request
 * auth context (attached by withMcpAuth in app/api/[transport]/route.ts)
 * and hands it to the handler as a second argument -- that's how every
 * tool below scopes its data to the caller without threading auth
 * through by hand.
 */
export function registerTools(server: McpServer) {
  server.registerTool(
    "create_note",
    {
      title: "Create Note",
      description: "Create a new note with a title and text content.",
      inputSchema: z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
      }),
    },
    withLogging("create_note", async ({ title, content }, apiKeyId) => {
      const [note] = await db
        .insert(notes)
        .values({ title, content, apiKeyId })
        .returning();
      return { content: [{ type: "text", text: `Created note ${note.id}: "${note.title}"` }] };
    }),
  );

  server.registerTool(
    "list_notes",
    {
      title: "List Notes",
      description: "List notes, most recently updated first.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(20),
      }),
    },
    withLogging("list_notes", async ({ limit }, apiKeyId) => {
      const rows = await db
        .select()
        .from(notes)
        .where(apiKeyId ? eq(notes.apiKeyId, apiKeyId) : undefined)
        .orderBy(desc(notes.updatedAt))
        .limit(limit);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }),
  );

  server.registerTool(
    "search_notes",
    {
      title: "Search Notes",
      description: "Search notes by a text query matched against title and content.",
      inputSchema: z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    },
    withLogging("search_notes", async ({ query, limit }, apiKeyId) => {
      const pattern = `%${query}%`;
      const scope = apiKeyId ? eq(notes.apiKeyId, apiKeyId) : undefined;
      const textMatch = or(ilike(notes.title, pattern), ilike(notes.content, pattern));
      const rows = await db
        .select()
        .from(notes)
        .where(scope ? and(scope, textMatch) : textMatch)
        .orderBy(desc(notes.updatedAt))
        .limit(limit);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }),
  );

  server.registerTool(
    "delete_note",
    {
      title: "Delete Note",
      description: "Delete a note by id.",
      inputSchema: z.object({ id: z.string().uuid() }),
    },
    withLogging("delete_note", async ({ id }, apiKeyId) => {
      const scope = apiKeyId ? and(eq(notes.id, id), eq(notes.apiKeyId, apiKeyId)) : eq(notes.id, id);
      const deleted = await db.delete(notes).where(scope).returning({ id: notes.id });
      if (deleted.length === 0) {
        return { content: [{ type: "text", text: `No note found with id ${id}` }], isError: true };
      }
      return { content: [{ type: "text", text: `Deleted note ${id}` }] };
    }),
  );

  server.registerTool(
    "create_alert",
    {
      title: "Create Alert",
      description:
        'Create an alert rule. condition is one of: {"type":"note_count_gte","value":number} or ' +
        '{"type":"notes_created_last_hours_gte","hours":number,"value":number}. A background job checks ' +
        "active alerts every 15 minutes and POSTs to webhookUrl (if set) when the condition holds.",
      inputSchema: z.object({
        condition: alertConditionSchema,
        message: z.string().min(1),
        webhookUrl: z.string().url().optional(),
      }),
    },
    withLogging("create_alert", async ({ condition, message, webhookUrl }, apiKeyId) => {
      const [alert] = await db
        .insert(alertsTable)
        .values({ condition, message, webhookUrl, apiKeyId })
        .returning();
      return { content: [{ type: "text", text: `Created alert ${alert.id}` }] };
    }),
  );

  server.registerTool(
    "list_alerts",
    {
      title: "List Alerts",
      description: "List alerts, active first.",
      inputSchema: z.object({}),
    },
    withLogging("list_alerts", async (_args, apiKeyId) => {
      const rows = await db
        .select()
        .from(alertsTable)
        .where(apiKeyId ? eq(alertsTable.apiKeyId, apiKeyId) : undefined)
        .orderBy(desc(alertsTable.createdAt));
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
    }),
  );

  server.registerTool(
    "get_stats",
    {
      title: "Get Stats",
      description: "Return call counts, most-used tool, and active alert count for this API key.",
      inputSchema: z.object({}),
    },
    withLogging("get_stats", async (_args, apiKeyId) => {
      const callScope = apiKeyId ? eq(mcpCalls.apiKeyId, apiKeyId) : undefined;
      const noteScope = apiKeyId ? eq(notes.apiKeyId, apiKeyId) : undefined;
      const alertScope = apiKeyId
        ? and(eq(alertsTable.apiKeyId, apiKeyId), eq(alertsTable.active, true))
        : eq(alertsTable.active, true);

      const [[callCount], [noteCount], [alertCount], topTools] = await Promise.all([
        db.select({ n: count() }).from(mcpCalls).where(callScope),
        db.select({ n: count() }).from(notes).where(noteScope),
        db.select({ n: count() }).from(alertsTable).where(alertScope),
        db
          .select({ toolName: mcpCalls.toolName, n: count() })
          .from(mcpCalls)
          .where(callScope)
          .groupBy(mcpCalls.toolName)
          .orderBy(desc(count()))
          .limit(5),
      ]);

      const stats = {
        totalCalls: callCount?.n ?? 0,
        totalNotes: noteCount?.n ?? 0,
        activeAlerts: alertCount?.n ?? 0,
        topTools: topTools.map((t) => ({ tool: t.toolName, calls: t.n })),
      };

      return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
    }),
  );
}

// Re-exported so app/api/keys/route.ts can validate a key still exists
// without importing the schema module directly in two places.
export { apiKeys };
