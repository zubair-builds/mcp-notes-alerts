import { db } from "./lib/db";
import { accessLogs } from "./lib/db/schema";
import { desc } from "drizzle-orm";
import fs from "fs";
import postgres from "postgres";

async function main() {
  const envFile = fs.readFileSync(".env", "utf8");
  const dbUrlMatch = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
  const dbUrl = dbUrlMatch ? dbUrlMatch[1] : process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("No DB URL");
    return;
  }

  // Using raw query to avoid needing drizzle setup boilerplate if not exported right
  const sql = postgres(dbUrl);
  const logs = await sql`SELECT * FROM access_logs ORDER BY created_at DESC LIMIT 15`;
  
  console.log(JSON.stringify(logs, null, 2));
  process.exit(0);
}

main().catch(console.error);
