import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";

// Dashboard-side note CRUD. Gated by middleware.ts — add
// "/api/notes/:path*" to its matcher so only a valid session reaches here.
// Notes created here have no apiKeyId, which is what marks them "by me"
// as opposed to written by an MCP client.

export async function POST(req: Request) {
  const { title, content } = await req.json().catch(() => ({}));
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const [row] = await db
    .insert(notes)
    .values({ title: title.trim(), content: typeof content === "string" ? content : "" })
    .returning({ id: notes.id, updatedAt: notes.updatedAt });
  return NextResponse.json(row);
}

export async function PATCH(req: Request) {
  const { id, title, content } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const [row] = await db
    .update(notes)
    .set({ title: title.trim(), content: typeof content === "string" ? content : "", updatedAt: new Date() })
    .where(eq(notes.id, id))
    .returning({ id: notes.id, updatedAt: notes.updatedAt });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(req: Request) {
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  await db.delete(notes).where(eq(notes.id, id));
  return NextResponse.json({ ok: true });
}
