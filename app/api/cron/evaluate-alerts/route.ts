import { NextResponse } from "next/server";
import { evaluateAllActiveAlerts } from "@/lib/mcp/alerts";

/**
 * Called by Vercel Cron per vercel.json (every 15 minutes). Vercel signs
 * cron requests with an Authorization: Bearer <CRON_SECRET> header when
 * CRON_SECRET is set in the project's env vars -- we check it here so
 * this endpoint can't be hit by anyone who finds the URL.
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const results = await evaluateAllActiveAlerts();
  return NextResponse.json({
    checked: results.length,
    fired: results.filter((r) => r.fired).length,
    errors: results.filter((r) => r.error).map((r) => ({ alertId: r.alert.id, error: r.error })),
  });
}
