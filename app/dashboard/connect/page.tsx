import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { KeysPanel } from "./keys-panel";
import { GeminiSetup } from "./gemini-setup";
import { relativeTime } from "../format";

export const dynamic = "force-dynamic";

export default async function ConnectPage() {
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

  const live = rows.filter((k) => !k.revoked);
  const used = (needle: string) => live.find((k) => k.name.toLowerCase().includes(needle));

  const clients = [
    { name: "Claude Code", transport: "/api/mcp · Streamable HTTP", match: used("claude"), hint: "Point it at /api/mcp with the key as a bearer token." },
    { name: "claude.ai connector", transport: "/api/sse · HTTP+SSE", match: used("sse") ?? used("claude.ai"), hint: "Its connector UI speaks SSE, not Streamable HTTP." },
    { name: "Gemini custom app", transport: "/mcp · OAuth 2.0", match: used("gemini"), hint: "Use the app credentials on the right." },
  ];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <h1 className="page-title">Connect</h1>
        <p className="muted" style={{ fontSize: 14.5, maxWidth: "60ch" }}>
          Issue a key per client, then point the client at the transport it speaks.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
        {clients.map((c) => (
          <div key={c.name} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ fontSize: 15 }}>{c.name}</h3>
              <span className={`tag ${c.match ? "tag-accent" : "tag-outline"}`}>{c.match ? "Connected" : "Not set up"}</span>
            </div>
            <span className="mono" style={{ fontSize: 12.5, color: "var(--color-neutral-400)" }}>
              {c.transport}
            </span>
            <span className="dim" style={{ fontSize: 12.5 }}>
              {c.match
                ? `key ${c.match.name}${c.match.lastUsedAt ? ` · last call ${relativeTime(c.match.lastUsedAt)}` : " · never used"}`
                : c.hint}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)", gap: 44, alignItems: "start" }}>
        <KeysPanel initialKeys={rows.map((k) => ({ ...k, createdAt: k.createdAt.toISOString(), lastUsedAt: k.lastUsedAt?.toISOString() ?? null }))} />
        <GeminiSetup />
      </div>
    </>
  );
}
