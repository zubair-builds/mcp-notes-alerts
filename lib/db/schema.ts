import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Single-tenant MVP schema: everything is scoped to an API key, not a
 * separate users table. If you outgrow "solo/personal use" and need
 * multiple people with their own notes/alerts, add a `users` table and
 * a `user_id` FK to each of these -- api_keys is the natural place to
 * hang that off of.
 */

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  // We only ever store a SHA-256 hash of the key, never the plaintext.
  keyHash: text("key_hash").notNull().unique(),
  // Non-secret prefix shown in the dashboard so a key can be identified
  // without ever displaying the full value again after creation.
  keyPrefix: text("key_prefix").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revoked: boolean("revoked").notNull().default(false),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
});

/**
 * `condition` is a small JSON DSL evaluated by lib/mcp/alerts.ts, e.g.:
 *   { "type": "note_count_gte", "value": 10 }
 *   { "type": "note_created_matching", "pattern": "invoice" }
 * Extend the interpreter in lib/mcp/alerts.ts as you add condition types.
 */
export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  condition: jsonb("condition").notNull(),
  message: text("message").notNull(),
  webhookUrl: text("webhook_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
});

export const mcpCalls = pgTable("mcp_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  toolName: text("tool_name").notNull(),
  args: jsonb("args"),
  status: text("status").notNull(), // "success" | "error"
  latencyMs: integer("latency_ms").notNull(),
  errorMessage: text("error_message"),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accessLogs = pgTable("access_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  method: text("method").notNull(),
  path: text("path").notNull(),
  statusCode: integer("status_code").notNull(),
  userAgent: text("user_agent"),
  ip: text("ip"),
  latencyMs: integer("latency_ms").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type McpCall = typeof mcpCalls.$inferSelect;
export type AccessLog = typeof accessLogs.$inferSelect;
