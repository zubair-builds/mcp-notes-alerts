"use client";

import { useEffect, useState } from "react";

export function GeminiSetup() {
  const [origin, setOrigin] = useState("");
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);
  const [copiedClientId, setCopiedClientId] = useState(false);
  const [copiedClientSecret, setCopiedClientSecret] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const copy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const appUrl = origin ? `${origin}/mcp` : "";
  const mockCred = "mock_client";

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Connect to Gemini</h2>
      <div style={{ background: "#12151c", border: "1px solid #1f232c", borderRadius: 8, padding: 16 }}>
        <p style={{ color: "#9aa3ad", marginTop: 0, fontSize: 14, marginBottom: 16 }}>
          Use the details below to add this server as a custom connected app in Gemini.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <CopyField 
            label="App Link URL" 
            value={appUrl} 
            copied={copiedAppUrl} 
            onCopy={() => copy(appUrl, setCopiedAppUrl)} 
          />
          <CopyField 
            label="OAuth Client ID" 
            value={mockCred} 
            copied={copiedClientId} 
            onCopy={() => copy(mockCred, setCopiedClientId)} 
          />
          <CopyField 
            label="OAuth Client Secret" 
            value={mockCred} 
            copied={copiedClientSecret} 
            onCopy={() => copy(mockCred, setCopiedClientSecret)} 
          />
        </div>
      </div>
    </div>
  );
}

function CopyField({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#9aa3ad", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          readOnly
          value={value}
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #2a2f3a",
            background: "#171a21",
            color: "#e6e8eb",
            fontSize: 13,
          }}
        />
        <button
          onClick={onCopy}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "1px solid #2a2f3a",
            background: copied ? "#22c55e" : "#1f232c",
            color: copied ? "#fff" : "#e6e8eb",
            cursor: "pointer",
            fontWeight: 500,
            transition: "background 0.2s",
            minWidth: 80,
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
