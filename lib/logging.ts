import { db } from "./db";
import { accessLogs } from "./db/schema";
import type { NextRequest } from "next/server";

export function withAccessLogging(
  handler: (req: NextRequest) => Promise<Response> | Response
) {
  return async (req: NextRequest) => {
    const start = Date.now();
    let res: Response;
    try {
      res = await handler(req);
    } catch (err) {
      // Log errors as 500 status
      const latencyMs = Date.now() - start;
      const ip = req.headers.get("x-forwarded-for") || null;
      const userAgent = req.headers.get("user-agent") || null;
      
      // Fire and forget logging
      db.insert(accessLogs)
        .values({
          method: req.method,
          path: req.nextUrl.pathname,
          statusCode: 500,
          userAgent,
          ip,
          latencyMs,
        })
        .catch(console.error);

      throw err;
    }

    const latencyMs = Date.now() - start;
    const ip = req.headers.get("x-forwarded-for") || null;
    const userAgent = req.headers.get("user-agent") || null;

    // Fire and forget logging
    db.insert(accessLogs)
      .values({
        method: req.method,
        path: req.nextUrl.pathname,
        statusCode: res.status,
        userAgent,
        ip,
        latencyMs,
      })
      .catch(console.error);

    return res;
  };
}
