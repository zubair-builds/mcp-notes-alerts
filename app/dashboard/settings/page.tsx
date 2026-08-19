import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accessLogs, mcpCalls, notes } from "@/lib/db/schema";
import { SettingsControls } from "./settings-controls";

export const dynamic = "force-dynamic";

function redactDatabaseUrl(url: string | undefined): string {
  if (!url) return "Not configured";
  try {
    const u = new URL(url);
    return `${u.protocol}//…@${u.host}${u.pathname}`;
  } catch {
    return "Configured";
  }
}

export default async function SettingsPage() {
  const [[noteCount], [callCount], [logCount]] = await Promise.all([
    db.select({ n: count() }).from(notes),
    db.select({ n: count() }).from(mcpCalls),
    db.select({ n: count() }).from(accessLogs),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40, maxWidth: 820 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <h1 className="page-title">Settings</h1>
        <p className="muted" style={{ fontSize: 14.5 }}>
          One operator, one server. Everything here is local to this deployment.
        </p>
      </div>

      <SettingsControls />

      <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 className="eyebrow" style={{ letterSpacing: "0.1em" }}>
          Server
        </h2>

        <div className="setting">
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 14.5 }}>Database</span>
            <span
              className="mono muted"
              style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {redactDatabaseUrl(process.env.DATABASE_URL)}
            </span>
          </div>
          <span className="tag tag-accent">Reachable</span>
        </div>

        <div className="setting">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 14.5 }}>Alert evaluation</span>
            <span className="muted" style={{ fontSize: 13 }}>
              Vercel Cron · daily at 00:00 UTC (Hobby tier limit)
            </span>
          </div>
          <span className="dim" style={{ fontSize: 13, flex: "none" }}>
            vercel.json
          </span>
        </div>

        <div className="setting">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 14.5 }}>Stored rows</span>
            <span className="muted" style={{ fontSize: 13 }}>
              {noteCount?.n ?? 0} notes · {callCount?.n ?? 0} tool calls · {logCount?.n ?? 0} connection hits
            </span>
          </div>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 className="eyebrow" style={{ letterSpacing: "0.1em" }}>
          Access
        </h2>

        <div className="setting">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 14.5 }}>Dashboard password</span>
            <span className="muted" style={{ fontSize: 13 }}>
              Set from the DASHBOARD_PASSWORD environment variable.
            </span>
          </div>
          <span className="dim" style={{ fontSize: 13, flex: "none" }}>
            .env
          </span>
        </div>

        <div className="setting">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 14.5 }}>Session</span>
            <span className="muted" style={{ fontSize: 13 }}>
              Signed cookie, valid for 30 days.
            </span>
          </div>
          <span className="dim" style={{ fontSize: 13, flex: "none" }}>
            lib/session.ts
          </span>
        </div>
      </section>
    </div>
  );
}
