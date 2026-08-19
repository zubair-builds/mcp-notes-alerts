import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { alerts, apiKeys, mcpCalls, notes } from "@/lib/db/schema";
import { Notifications } from "./notifications";
import { Sidebar } from "./sidebar";
import { relativeTime } from "./format";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [[noteCount], [alertCount], [clientCount], [lastCall]] = await Promise.all([
    db.select({ n: count() }).from(notes),
    db.select({ n: count() }).from(alerts).where(eq(alerts.active, true)),
    db.select({ n: count() }).from(apiKeys).where(eq(apiKeys.revoked, false)),
    db.select({ at: mcpCalls.createdAt }).from(mcpCalls).orderBy(desc(mcpCalls.createdAt)).limit(1),
  ]);

  return (
    <div className="shell">
      <Sidebar
        counts={{ notes: noteCount?.n ?? 0, alerts: alertCount?.n ?? 0 }}
        health={{
          clients: clientCount?.n ?? 0,
          lastCall: lastCall?.at ? relativeTime(lastCall.at) : null,
        }}
      />
      <main className="canvas">
        <Notifications />
        {children}
      </main>
    </div>
  );
}
