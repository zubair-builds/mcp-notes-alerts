import { count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { alerts, mcpCalls, notes } from "@/lib/db/schema";
import { KeysPanel } from "./keys-panel";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    [totalCallsRow],
    [totalNotesRow],
    [activeAlertsRow],
    [errorRow],
    callsByDay,
    topTools,
    recentCalls,
  ] = await Promise.all([
    db.select({ n: count() }).from(mcpCalls),
    db.select({ n: count() }).from(notes),
    db.select({ n: count() }).from(alerts).where(eq(alerts.active, true)),
    db.select({ n: count() }).from(mcpCalls).where(eq(mcpCalls.status, "error")),
    db
      .select({
        day: sql<string>`to_char(${mcpCalls.createdAt}, 'YYYY-MM-DD')`,
        n: count(),
      })
      .from(mcpCalls)
      .where(gte(mcpCalls.createdAt, sevenDaysAgo))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({ tool: mcpCalls.toolName, n: count() })
      .from(mcpCalls)
      .groupBy(mcpCalls.toolName)
      .orderBy(desc(count()))
      .limit(8),
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
      .limit(25),
  ]);

  const totalCalls = totalCallsRow?.n ?? 0;
  const errorCount = errorRow?.n ?? 0;

  return {
    totalCalls,
    totalNotes: totalNotesRow?.n ?? 0,
    activeAlerts: activeAlertsRow?.n ?? 0,
    errorRate: totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0,
    callsByDay,
    topTools,
    recentCalls,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const maxDayCount = Math.max(1, ...data.callsByDay.map((d) => d.n));

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ marginBottom: 4 }}>Dashboard</h1>
      <p style={{ color: "#9aa3ad", marginTop: 0 }}>Live view of your MCP server's activity.</p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, margin: "24px 0" }}>
        <StatCard label="Total calls" value={data.totalCalls} />
        <StatCard label="Notes" value={data.totalNotes} />
        <StatCard label="Active alerts" value={data.activeAlerts} />
        <StatCard label="Error rate" value={`${data.errorRate.toFixed(1)}%`} />
      </section>

      <section style={{ margin: "32px 0" }}>
        <h2 style={{ fontSize: 16 }}>Calls, last 7 days</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
          {data.callsByDay.length === 0 && <p style={{ color: "#9aa3ad" }}>No calls yet.</p>}
          {data.callsByDay.map((d) => (
            <div key={d.day} style={{ textAlign: "center" }}>
              <div
                style={{
                  height: `${(d.n / maxDayCount) * 100}px`,
                  width: 32,
                  background: "#7dd3fc",
                  borderRadius: 4,
                }}
                title={`${d.n} calls`}
              />
              <div style={{ fontSize: 11, color: "#9aa3ad", marginTop: 4 }}>{d.day.slice(5)}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, margin: "32px 0" }}>
        <div>
          <h2 style={{ fontSize: 16 }}>Top tools</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <tbody>
              {data.topTools.map((t) => (
                <tr key={t.tool} style={{ borderBottom: "1px solid #1f232c" }}>
                  <td style={{ padding: "6px 0" }}>{t.tool}</td>
                  <td style={{ padding: "6px 0", textAlign: "right", color: "#9aa3ad" }}>{t.n}</td>
                </tr>
              ))}
              {data.topTools.length === 0 && (
                <tr>
                  <td style={{ color: "#9aa3ad" }}>No calls yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <KeysPanel />
      </section>

      <section style={{ margin: "32px 0" }}>
        <h2 style={{ fontSize: 16 }}>Recent activity</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#9aa3ad" }}>
              <th style={{ fontWeight: 400, padding: "6px 0" }}>Tool</th>
              <th style={{ fontWeight: 400 }}>Status</th>
              <th style={{ fontWeight: 400 }}>Latency</th>
              <th style={{ fontWeight: 400 }}>When</th>
            </tr>
          </thead>
          <tbody>
            {data.recentCalls.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #1f232c" }}>
                <td style={{ padding: "6px 0" }}>{c.toolName}</td>
                <td style={{ color: c.status === "error" ? "#f87171" : "#4ade80" }}>{c.status}</td>
                <td>{c.latencyMs}ms</td>
                <td style={{ color: "#9aa3ad" }}>{new Date(c.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {data.recentCalls.length === 0 && (
              <tr>
                <td style={{ color: "#9aa3ad", padding: "6px 0" }}>No calls yet -- connect a client and try a tool.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#12151c", border: "1px solid #1f232c", borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 12, color: "#9aa3ad" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  );
}
