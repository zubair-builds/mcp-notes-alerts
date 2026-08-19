import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { generateApiKey } from "@/lib/auth";

// Gated by middleware.ts (matcher includes /api/keys/:path*) -- only
// requests carrying a valid dashboard session cookie reach here.

export async function GET() {
  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      revoked: apiKeys.revoked,
    })
    .from(apiKeys)
    .orderBy(desc(apiKeys.createdAt));
  return NextResponse.json({ keys: rows });
}

export async function POST(req: Request) {
  const { name } = await req.json().catch(() => ({ name: "" }));
  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const generated = generateApiKey(name.trim());
  const [row] = await db
    .insert(apiKeys)
    .values({ name: generated.name, keyHash: generated.keyHash, keyPrefix: generated.keyPrefix })
    .returning({ id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, createdAt: apiKeys.createdAt });

  // rawKey is only ever returned here, at creation time. It is never
  // stored or retrievable again -- copy it into Claude's connector
  // config immediately.
  return NextResponse.json({ ...row, rawKey: generated.rawKey });
}

export async function DELETE(req: Request) {
  const { id } = await req.json().catch(() => ({ id: "" }));
  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  await db.update(apiKeys).set({ revoked: true }).where(eq(apiKeys.id, id));
  return NextResponse.json({ ok: true });
}
