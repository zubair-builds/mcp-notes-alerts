import { and, count, eq, gte } from "drizzle-orm";
import { db } from "../db";
import { notes, alerts as alertsTable, type Alert } from "../db/schema";
import { z } from "zod";

/**
 * Small JSON DSL for alert conditions, kept intentionally tiny for the
 * MVP. Add a new branch here (and to alertConditionSchema) whenever you
 * want a new condition type -- the cron job and create_alert tool both
 * validate against this schema so bad conditions are rejected up front
 * rather than silently never firing.
 */
export const alertConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("note_count_gte"), value: z.number().int().positive() }),
  z.object({
    type: z.literal("notes_created_last_hours_gte"),
    hours: z.number().positive(),
    value: z.number().int().positive(),
  }),
]);

export type AlertCondition = z.infer<typeof alertConditionSchema>;

/** Returns true if the alert's condition currently holds. */
export async function evaluateCondition(condition: AlertCondition, apiKeyId: string | null): Promise<boolean> {
  switch (condition.type) {
    case "note_count_gte": {
      const scope = apiKeyId ? eq(notes.apiKeyId, apiKeyId) : undefined;
      const [row] = await db.select({ n: count() }).from(notes).where(scope);
      return (row?.n ?? 0) >= condition.value;
    }
    case "notes_created_last_hours_gte": {
      const since = new Date(Date.now() - condition.hours * 60 * 60 * 1000);
      const scope = apiKeyId
        ? and(eq(notes.apiKeyId, apiKeyId), gte(notes.createdAt, since))
        : gte(notes.createdAt, since);
      const [row] = await db.select({ n: count() }).from(notes).where(scope);
      return (row?.n ?? 0) >= condition.value;
    }
  }
}

/** Evaluates every active alert and fires (webhook + last_triggered_at) any
 * whose condition currently holds. Called from the Vercel Cron route. */
export async function evaluateAllActiveAlerts() {
  const active = await db.select().from(alertsTable).where(eq(alertsTable.active, true));

  const results: { alert: Alert; fired: boolean; error?: string }[] = [];

  for (const alert of active) {
    try {
      const condition = alertConditionSchema.parse(alert.condition);
      const holds = await evaluateCondition(condition, alert.apiKeyId);
      if (holds) {
        await fireAlert(alert);
        results.push({ alert, fired: true });
      } else {
        results.push({ alert, fired: false });
      }
    } catch (err) {
      results.push({ alert, fired: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return results;
}

async function fireAlert(alert: Alert) {
  if (alert.webhookUrl) {
    await fetch(alert.webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alertId: alert.id, message: alert.message, condition: alert.condition }),
    }).catch(() => {
      // Best-effort delivery. Consider adding a delivery-failure count
      // column if you need retries or visibility into flaky webhooks.
    });
  }

  await db
    .update(alertsTable)
    .set({ lastTriggeredAt: new Date() })
    .where(eq(alertsTable.id, alert.id));
}
