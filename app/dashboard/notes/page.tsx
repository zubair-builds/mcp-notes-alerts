import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys, notes } from "@/lib/db/schema";
import { NotesWorkspace } from "./notes-workspace";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const rows = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
      author: apiKeys.name,
    })
    .from(notes)
    .leftJoin(apiKeys, eq(notes.apiKeyId, apiKeys.id))
    .orderBy(desc(notes.updatedAt));

  return (
    <NotesWorkspace
      notes={rows.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }))}
    />
  );
}
