import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { gt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const sinceParam = req.nextUrl.searchParams.get("since");
  
  if (!sinceParam) {
    return NextResponse.json({ notes: [] });
  }

  const sinceDate = new Date(parseInt(sinceParam, 10));
  if (isNaN(sinceDate.getTime())) {
    return NextResponse.json({ error: "Invalid since parameter" }, { status: 400 });
  }

  // Fetch any notes created strictly after the given timestamp
  const newNotes = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      createdAt: notes.createdAt,
    })
    .from(notes)
    .where(gt(notes.createdAt, sinceDate.toISOString() as any));

  return NextResponse.json({ notes: newNotes });
}
