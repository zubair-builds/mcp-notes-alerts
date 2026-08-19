import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

// A small max pool size is fine here: Vercel functions are short-lived and
// each invocation gets its own connection budget. Bump this if you move
// off serverless functions onto a long-running server.
const client = postgres(process.env.DATABASE_URL, { max: 5 });

export const db = drizzle(client, { schema });
