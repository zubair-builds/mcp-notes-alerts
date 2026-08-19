"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { relativeTime } from "../format";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
};

const GRID = "minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) 88px";

export function KeysPanel({ initialKeys }: { initialKeys: ApiKeyRow[] }) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/keys");
    if (res.ok) setKeys((await res.json()).keys);
    router.refresh();
  }

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setBusy(false);
    if (!res.ok) return;
    const data = await res.json();
    setJustCreated(data.rawKey);
    setNewName("");
    setCreating(false);
    refresh();
  }

  async function revoke(id: string) {
    setBusy(true);
    await fetch("/api/keys", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    refresh();
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 15 }}>API keys</h2>
        <button className="btn btn-primary" onClick={() => setCreating((v) => !v)}>
          <i className="ph ph-key" style={{ fontSize: 15 }} /> New key
        </button>
      </div>

      {creating && (
        <form onSubmit={createKey} style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Key name, e.g. claude-desktop"
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={busy || !newName.trim()}>
            Create
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>
            Cancel
          </button>
        </form>
      )}

      {justCreated && (
        <div
          style={{
            padding: "16px 18px",
            borderRadius: "var(--radius-md)",
            border: "1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)",
            background: "color-mix(in srgb, var(--color-accent) 8%, transparent)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--color-accent-200)" }}>
            <i className="ph ph-warning-circle" style={{ fontSize: 15 }} /> Copy this now — it won&apos;t be shown again.
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <code
              style={{
                flex: 1,
                fontSize: 13,
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                background: "color-mix(in srgb, var(--color-bg) 70%, transparent)",
                wordBreak: "break-all",
              }}
            >
              {justCreated}
            </code>
            <button
              className="btn btn-primary"
              onClick={() => {
                navigator.clipboard.writeText(justCreated);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="rows">
        <div className="rows-head" style={{ display: "grid", gridTemplateColumns: GRID, gap: 16 }}>
          <span>Name</span>
          <span>Prefix</span>
          <span>Last used</span>
          <span />
        </div>
        {keys.length === 0 && (
          <div className="row dim" style={{ display: "block" }}>
            No keys yet — create one above.
          </div>
        )}
        {keys.map((k) => (
          <div
            key={k.id}
            className={`row ${k.revoked ? "row-muted" : "row-hover"}`}
            style={{ display: "grid", gridTemplateColumns: GRID, gap: 16 }}
          >
            <span>{k.name}</span>
            <span className="mono muted" style={{ fontSize: 12.5 }}>
              {k.keyPrefix}…
            </span>
            <span className="muted">{k.lastUsedAt ? relativeTime(k.lastUsedAt) : "never"}</span>
            {k.revoked ? (
              <span className="dim" style={{ textAlign: "right", fontSize: 13 }}>
                Revoked
              </span>
            ) : (
              <button
                className="btn btn-ghost"
                onClick={() => revoke(k.id)}
                disabled={busy}
                style={{ color: "var(--color-danger)", justifySelf: "end", padding: "4px 8px" }}
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
