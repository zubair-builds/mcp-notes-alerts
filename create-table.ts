import { db } from "./lib/db";
import postgres from "postgres";
import fs from "fs";

async function main() {
  const envFile = fs.readFileSync(".env", "utf8");
  const dbUrlMatch = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
  const dbUrl = dbUrlMatch ? dbUrlMatch[1] : process.env.DATABASE_URL;
  const sql = postgres(dbUrl!);
  
  await sql`
    CREATE TABLE IF NOT EXISTS "access_logs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "method" text NOT NULL,
      "path" text NOT NULL,
      "status_code" integer NOT NULL,
      "user_agent" text,
      "ip" text,
      "latency_ms" integer NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `;

  console.log("Created access_logs table");
  process.exit(0);
}

main().catch(console.error);
