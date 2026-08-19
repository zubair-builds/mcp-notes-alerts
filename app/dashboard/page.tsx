import Link from "next/link";
import { count, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { alerts, apiKeys, mcpCalls, notes } from "@/lib/db/schema";
import { excerpt, relativeTime } from "./format";

export const dynamic = "force-dynamic";

type FeedItem = {
  key: string;
  kind: "note" | "alert" | "error";
  at: Date;
  actor: string;
  title: string;
  body?: string;
  meta?: string;
};

async function getOverview() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [
    [callsToday],
    [callsPrevDay],
    [errorsToday],
    [notesWeek],
    [callsWeek],
    callsByDay,
    topTools,
    recentNotes,
    firedAlerts,
    recentErrors,
    activeAlerts,
    clients,
  ] = await Promise.all([
    db.select({ n: count() }).from(mcpCalls).where(gte(mcpCalls.createdAt, dayAgo)),
    db
      .select({ n: count() })
      .from(mcpCalls)
      .where(
        sql`${mcpCalls.createdAt} >= ${twoDaysAgo.toISOString()} and ${mcpCalls.createdAt} < ${dayAgo.toISOString()}`,
      ),
    db
      .select({ n: count() })
      .from(mcpCalls)
      .where(sql`${mcpCalls.status} = 'error' and ${mcpCalls.createdAt} >= ${dayAgo.toISOString()}`),
    db.select({ n: count() }).from(notes).where(gte(notes.createdAt, weekAgo)),
    db.select({ n: count() }).from(mcpCalls).where(gte(mcpCalls.createdAt, weekAgo)),
    db
      .select({ day: sql<string>`to_char(${mcpCalls.createdAt}, 'YYYY-MM-DD')`, n: count() })
      .from(mcpCalls)
      .where(gte(mcpCalls.createdAt, weekAgo))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({ tool: mcpCalls.toolName, n: count() })
      .from(mcpCalls)
      .groupBy(mcpCalls.toolName)
      .orderBy(desc(count()))
      .limit(4),
    db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        updatedAt: notes.updatedAt,
        author: apiKeys.name,
      })
      .from(notes)
      .leftJoin(apiKeys, eq(notes.apiKeyId, apiKeys.id))
      .orderBy(desc(notes.updatedAt))
      .limit(6),
    db
      .select({
        id: alerts.id,
        message: alerts.message,
        condition: alerts.condition,
        webhookUrl: alerts.webhookUrl,
        lastTriggeredAt: alerts.lastTriggeredAt,
      })
      .from(alerts)
      .where(isNotNull(alerts.lastTriggeredAt))
      .orderBy(desc(alerts.lastTriggeredAt))
      .limit(3),
    db
      .select({
        id: mcpCalls.id,
        toolName: mcpCalls.toolName,
        errorMessage: mcpCalls.errorMessage,
        latencyMs: mcpCalls.latencyMs,
        createdAt: mcpCalls.createdAt,
      })
      .from(mcpCalls)
      .where(eq(mcpCalls.status, "error"))
      .orderBy(desc(mcpCalls.createdAt))
      .limit(3),
    db
      .select({
        id: alerts.id,
        message: alerts.message,
        active: alerts.active,
        webhookUrl: alerts.webhookUrl,
        lastTriggeredAt: alerts.lastTriggeredAt,
      })
      .from(alerts)
      .orderBy(desc(alerts.active), desc(alerts.createdAt))
      .limit(4),
    db
      .select({ name: apiKeys.name, lastUsedAt: apiKeys.lastUsedAt })
      .from(apiKeys)
      .where(eq(apiKeys.revoked, false))
      .orderBy(desc(apiKeys.lastUsedAt))
      .limit(4),
  ]);

  const feed: FeedItem[] = [
    ...recentNotes.map((n) => ({
      key: `note-${n.id}`,
      kind: "note" as const,
      at: n.updatedAt,
      actor: n.author ? `${n.author} wrote a note` : "Note saved",
      title: n.title,
      body: excerpt(n.content, 220),
    })),
    ...firedAlerts.map((a) => ({
      key: `alert-${a.id}`,
      kind: "alert" as const,
      at: a.lastTriggeredAt as Date,
      actor: "Alert fired",
      title: a.message,
      body: JSON.stringify(a.condition),
      meta: a.webhookUrl ? "webhook posted" : "no webhook",
    })),
    ...recentErrors.map((c) => ({
      key: `err-${c.id}`,
      kind: "error" as const,
      at: c.createdAt,
      actor: "Call failed",
      title: c.errorMessage ?? "Unknown error",
      meta: `${c.toolName} · ${c.latencyMs}ms`,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  const today = callsToday?.n ?? 0;
  const yesterday = callsPrevDay?.n ?? 0;

  return {
    today,
    delta: yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : null,
    errorsToday: errorsToday?.n ?? 0,
    notesWeek: notesWeek?.n ?? 0,
    callsWeek: callsWeek?.n ?? 0,
    callsByDay,
    topTools,
    feed,
    activeAlerts,
    clients,
  };
}

const ICONS: Record<FeedItem["kind"], string> = {
  note: "ph-note-pencil",
  alert: "ph-bell-ringing",
  error: "ph-warning-circle",
};

export default async function DashboardPage() {
  const d = await getOverview();
  const maxDay = Math.max(1, ...d.callsByDay.map((x) => x.n));
  const maxTool = Math.max(1, ...d.topTools.map((t) => t.n));
  const errorRate = d.today > 0 ? ((d.errorsToday / d.today) * 100).toFixed(1) : "0.0";

  return (
    <>
      <div className="page-head">
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <h1 className="page-title">Overview</h1>
          <p className="muted" style={{ fontSize: 14.5 }}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
            {d.today} {d.today === 1 ? "call" : "calls"} today
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard/activity" className="btn btn-secondary">
            <i className="ph ph-pulse" style={{ fontSize: 15 }} /> Activity log
          </Link>
          <Link href="/dashboard/notes?new=1" className="btn btn-primary">
            <i className="ph ph-plus" style={{ fontSize: 15 }} /> New note
          </Link>
        </div>
      </div>

      <div className="strip">
        <div className="strip-cell">
          <span className="eyebrow">Calls today</span>
          <span style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <span className="strip-value">{d.today}</span>
            {d.delta !== null && (
              <span style={{ fontSize: 12.5, color: d.delta >= 0 ? "var(--color-accent-300)" : "var(--color-neutral-500)" }}>
                {d.delta >= 0 ? "+" : ""}
                {d.delta}%
              </span>
            )}
          </span>
        </div>
        <div className="strip-cell">
          <span className="eyebrow">Notes this week</span>
          <span style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <span className="strip-value">{d.notesWeek}</span>
            <span className="dim" style={{ fontSize: 12.5 }}>
              written by agents
            </span>
          </span>
        </div>
        <div className="strip-cell">
          <span className="eyebrow">Errors today</span>
          <span style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <span className="strip-value" style={{ color: d.errorsToday > 0 ? "var(--color-danger)" : undefined }}>
              {d.errorsToday}
            </span>
            <span className="dim" style={{ fontSize: 12.5 }}>
              {errorRate}% of calls
            </span>
          </span>
        </div>
        <div className="strip-cell" style={{ flex: 1.3, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
          <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="eyebrow">Last 7 days</span>
            <span className="muted" style={{ fontSize: 12.5 }}>
              {d.callsWeek.toLocaleString()} calls
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 38 }}>
            {d.callsByDay.map((x, i) => (
              <span
                key={x.day}
                title={`${x.day}: ${x.n} calls`}
                style={{
                  width: 7,
                  height: `${Math.max(12, (x.n / maxDay) * 100)}%`,
                  borderRadius: 2,
                  background:
                    i === d.callsByDay.length - 1
                      ? "var(--color-accent)"
                      : "color-mix(in srgb, var(--color-accent) 30%, transparent)",
                  boxShadow:
                    i === d.callsByDay.length - 1
                      ? "0 0 10px color-mix(in srgb, var(--color-accent) 55%, transparent)"
                      : undefined,
                }}
              />
            ))}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)", gap: 44, alignItems: "start" }}>
        <section style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 15 }}>Written by your agents</h2>
            <Link href="/dashboard/activity" style={{ fontSize: 13 }}>
              All activity
            </Link>
          </div>

          {d.feed.length === 0 ? (
            <div className="empty">
              Nothing written yet — connect a client from <Link href="/dashboard/connect">Connect</Link> and ask it to
              save a note.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {d.feed.map((item) => (
                <article key={item.key} className="card card-hover" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <i
                      className={`ph ${ICONS[item.kind]}`}
                      style={{ fontSize: 16, color: item.kind === "error" ? "var(--color-danger)" : "var(--color-accent)" }}
                    />
                    <span className="muted" style={{ fontSize: 12.5 }}>
                      {item.actor} · {relativeTime(item.at)}
                    </span>
                    {item.meta && (
                      <span className="mono dim" style={{ marginLeft: "auto", fontSize: 11.5 }}>
                        {item.meta}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: item.kind === "error" ? 14 : 16, fontFamily: item.kind === "error" ? "var(--font-mono)" : undefined }}>
                    {item.title}
                  </h3>
                  {item.body && (
                    <p
                      className={item.kind === "alert" ? "mono muted" : "muted"}
                      style={{ fontSize: item.kind === "alert" ? 12.5 : 14, lineHeight: 1.6, maxWidth: "68ch" }}
                    >
                      {item.body}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <aside style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 15 }}>Alerts</h2>
              <Link href="/dashboard/alerts" style={{ fontSize: 13 }}>
                Manage
              </Link>
            </div>
            {d.activeAlerts.length === 0 ? (
              <p className="dim" style={{ fontSize: 13 }}>
                No alerts configured.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {d.activeAlerts.map((a, i) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "14px 4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      borderTop: i === 0 ? "none" : "1px solid var(--color-hairline)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span className={`dot ${a.active ? "dot-live" : "dot-off"}`} />
                      <span style={{ fontSize: 14, color: a.active ? undefined : "var(--color-neutral-500)" }}>{a.message}</span>
                    </span>
                    <span className="dim" style={{ fontSize: 12, paddingLeft: 15 }}>
                      {!a.active
                        ? "paused"
                        : `${a.lastTriggeredAt ? `fired ${relativeTime(a.lastTriggeredAt)}` : "never fired"} · ${
                            a.webhookUrl ? "webhook" : "desktop notification"
                          }`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 15 }}>Busiest tools</h2>
            {d.topTools.length === 0 ? (
              <p className="dim" style={{ fontSize: 13 }}>
                No calls yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {d.topTools.map((t) => (
                  <div key={t.tool} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                      <span className="mono" style={{ fontSize: 12.5, color: "var(--color-neutral-300)" }}>
                        {t.tool}
                      </span>
                      <span className="muted">{t.n}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: "var(--color-hairline)" }}>
                      <div
                        style={{
                          width: `${(t.n / maxTool) * 100}%`,
                          height: "100%",
                          borderRadius: 2,
                          background: "var(--color-accent)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            style={{
              padding: "18px 20px",
              borderRadius: "var(--radius-md)",
              border: "1px solid color-mix(in srgb, var(--color-accent) 26%, transparent)",
              display: "flex",
              flexDirection: "column",
              gap: 9,
            }}
          >
            <span style={{ fontSize: 14 }}>
              {d.clients.length} {d.clients.length === 1 ? "client" : "clients"} connected
            </span>
            <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              {d.clients.length > 0 ? d.clients.map((c) => c.name).join(", ") : "No active keys yet."}
            </span>
            <Link href="/dashboard/connect" style={{ fontSize: 13 }}>
              Issue a key →
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
