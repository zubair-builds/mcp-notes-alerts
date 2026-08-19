"use client";

import { useEffect, useState } from "react";

export function GeminiSetup() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const mockCred = "mock_client";

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={{ fontSize: 15 }}>Gemini app credentials</h2>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          Paste these into Gemini&apos;s custom connected app form. The mock OAuth flow approves automatically.
        </p>
        <CopyField label="App link URL" value={origin ? `${origin}/mcp` : ""} />
        <CopyField label="Client ID" value={mockCred} />
        <CopyField label="Client secret" value={mockCred} />
      </div>

      <p className="dim" style={{ fontSize: 12.5, lineHeight: 1.65 }}>
        Mock OAuth exists for Gemini&apos;s requirement only — it approves every authorization request. Don&apos;t
        expose this server publicly until it&apos;s real.
      </p>
    </section>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input readOnly value={value} className="input input-mono" style={{ padding: "9px 12px" }} />
        <button
          className="btn btn-secondary"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{ minWidth: 74 }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
