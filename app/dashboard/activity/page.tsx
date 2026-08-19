import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { accessLogs, mcpCalls } from "@/lib/db/schema";
import { absoluteTime, relativeTime } from "../format";

export const dynamic = "force-dynamic";

const CALL_GRID = "minmax(0, 1.2fr) 90px 90px minmax(0, 1fr)";
const LOG_GRID = "70px 70px minmax(0, 1.4fr) 80px minmax(0, 1.2fr) minmax(0, 0.9fr)";

export default async function ActivityPage() {
  const [calls, logs] = await Promise.all([
    db
      .select({
        id: mcpCalls.id,
        toolName: mcpCalls.toolName,
        status: mcpCalls.status,
        latencyMs: mcpCalls.latencyMs,
        errorMessage: mcpCalls.errorMessage,
        createdAt: mcpCalls.createdAt,
      })
      .from(mcpCalls)
      .orderBy(desc(mcpCalls.createdAt))
      .limit(50),
    db
      .select({
        id: accessLogs.id,
        method: accessLogs.method,
        path: accessLogs.path,
        statusCode: accessLogs.statusCode,
        userAgent: accessLogs.userAgent,
        latencyMs: accessLogs.latencyMs,
        createdAt: accessLogs.createdAt,
      })
      .from(accessLogs)
      .orderBy(desc(accessLogs.createdAt))
      .limit(50),
  ]);

  const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <h1 className="page-title">Activity log</h1>
        <p className="muted" style={{ fontSize: 14.5, maxWidth: "60ch" }}>
          Every tool call and every connection hit, newest first.
        </p>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 15 }}>Tool calls</h2>
        <div className="rows">
          <div className="rows-head" style={{ display: "grid", gridTemplateColumns: CALL_GRID, gap: 16 }}>
            <span>Tool</span>
            <span>Status</span>
            <span>Latency</span>
            <span>When</span>
          </div>
          {calls.length === 0 && <div className="row dim" style={{ display: "block" }}>No calls yet.</div>}
          {calls.map((c) => (
            <div key={c.id} className="row row-hover" style={{ display: "grid", gridTemplateColumns: CALL_GRID, gap: 16 }}>
              <span className="mono" style={{ fontSize: 12.5, ...ellipsis }} title={c.errorMessage ?? undefined}>
                {c.toolName}
              </span>
              <span style={{ color: c.status === "error" ? "var(--color-danger)" : "var(--color-accent-300)" }}>
                {c.status}
              </span>
              <span className="muted">{c.latencyMs}ms</span>
              <span className="muted" title={new Date(c.createdAt).toLocaleString()}>
                {relativeTime(c.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 15 }}>Connection hits</h2>
        <div className="rows">
          <div className="rows-head" style={{ display: "grid", gridTemplateColumns: LOG_GRID, gap: 16 }}>
            <span>Status</span>
            <span>Method</span>
            <span>Path</span>
            <span>Latency</span>
            <span>Client</span>
            <span>When</span>
          </div>
          {logs.length === 0 && <div className="row dim" style={{ display: "block" }}>No connection logs yet.</div>}
          {logs.map((l) => (
            <div key={l.id} className="row row-hover" style={{ display: "grid", gridTemplateColumns: LOG_GRID, gap: 16 }}>
              <span style={{ color: l.statusCode >= 400 ? "var(--color-danger)" : "var(--color-accent-300)" }}>
                {l.statusCode}
              </span>
              <span className="muted">{l.method}</span>
              <span className="mono" style={{ fontSize: 12.5, ...ellipsis }} title={l.path}>
                {l.path}
              </span>
              <span className="muted">{l.latencyMs}ms</span>
              <span className="muted" style={ellipsis} title={l.userAgent || "Unknown"}>
                {l.userAgent || "—"}
              </span>
              <span className="dim" title={new Date(l.createdAt).toLocaleString()}>
                {absoluteTime(l.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
