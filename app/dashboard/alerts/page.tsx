import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { alerts } from "@/lib/db/schema";
import { relativeTime } from "../format";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const allAlerts = await db.select().from(alerts).orderBy(desc(alerts.active), desc(alerts.createdAt));

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <h1 className="page-title">Alerts</h1>
        <p className="muted" style={{ fontSize: 14.5, maxWidth: "60ch" }}>
          Conditions evaluated on a schedule. When one holds, its webhook fires.
        </p>
      </div>

      {allAlerts.length === 0 ? (
        <div className="empty">No alerts configured yet — ask an agent to create one.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 980 }}>
          {allAlerts.map((alert) => (
            <article
              key={alert.id}
              className="card card-hover"
              style={{ display: "flex", alignItems: "flex-start", gap: 24, opacity: alert.active ? 1 : 0.6 }}
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className={`dot ${alert.active ? "dot-live" : "dot-off"}`} />
                  <span className="muted" style={{ fontSize: 12.5 }}>
                    {alert.active ? "Active" : "Paused"} · created {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: 16 }}>{alert.message}</h3>

                <span className="mono muted" style={{ fontSize: 12.5 }}>
                  {JSON.stringify(alert.condition)}
                </span>

                {alert.webhookUrl && (
                  <span
                    className="dim"
                    style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={alert.webhookUrl}
                  >
                    <i className="ph ph-link-simple" style={{ fontSize: 13, verticalAlign: "-1px" }} /> {alert.webhookUrl}
                  </span>
                )}
              </div>

              <div className="dim" style={{ textAlign: "right", fontSize: 12, minWidth: 150, flex: "none" }}>
                {alert.lastTriggeredAt ? `Fired ${relativeTime(alert.lastTriggeredAt)}` : "Never fired"}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
