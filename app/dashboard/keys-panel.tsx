"use client";

import { useEffect, useState } from "react";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
};

export function KeysPanel() {
  const [keys, setKeys] = useState<ApiKeyRow[] | null>(null);
  const [newName, setNewName] = useState("");
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data.keys);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setJustCreated(data.rawKey);
      setNewName("");
      refresh();
    }
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
    <div>
      <h2 style={{ fontSize: 16 }}>API keys</h2>

      {justCreated && (
        <div
          style={{
            background: "#12251a",
            border: "1px solid #1f4a2f",
            borderRadius: 6,
            padding: 12,
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            Copy this now -- it won't be shown again. Paste it as the bearer token in Claude's connector config.
          </div>
          <code style={{ wordBreak: "break-all" }}>{justCreated}</code>
        </div>
      )}

      <form onSubmit={createKey} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Key name, e.g. claude-desktop"
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #2a2f3a",
            background: "#171a21",
            color: "#e6e8eb",
          }}
        />
        <button
          type="submit"
          disabled={busy}
          style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#7dd3fc", fontWeight: 600 }}
        >
          Create
        </button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          {(keys ?? []).map((k) => (
            <tr key={k.id} style={{ borderBottom: "1px solid #1f232c", opacity: k.revoked ? 0.5 : 1 }}>
              <td style={{ padding: "6px 0" }}>{k.name}</td>
              <td style={{ color: "#9aa3ad" }}>{k.keyPrefix}...</td>
              <td style={{ textAlign: "right" }}>
                {!k.revoked && (
                  <button
                    onClick={() => revoke(k.id)}
                    disabled={busy}
                    style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}
                  >
                    Revoke
                  </button>
                )}
                {k.revoked && <span style={{ color: "#9aa3ad" }}>revoked</span>}
              </td>
            </tr>
          ))}
          {keys?.length === 0 && (
            <tr>
              <td style={{ color: "#9aa3ad", padding: "6px 0" }}>No keys yet -- create one above.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
