import Link from "next/link";

const ENDPOINTS = [
  { path: "/api/mcp", note: "Streamable HTTP · Claude Code, API clients" },
  { path: "/api/sse", note: "HTTP+SSE · claude.ai remote connectors" },
  { path: "/mcp", note: "OAuth app link · Gemini custom apps" },
];

const CAPABILITIES = [
  {
    icon: "ph-note-pencil",
    title: "Notes it writes for you",
    body: "create, search, delete — the model keeps the workspace, you keep the rows.",
  },
  {
    icon: "ph-table",
    title: "Schemas on demand",
    body: "describe a table in a sentence; it lands in Postgres with typed columns.",
  },
  {
    icon: "ph-bell-ringing",
    title: "Alerts that act",
    body: "conditions evaluated on a schedule, fired at a webhook or your desktop.",
  },
];

export default function Home() {
  return (
    <main style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 420px at 22% -8%, color-mix(in srgb, var(--color-accent) 15%, transparent), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <header
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "26px 72px",
          borderBottom: "1px solid var(--color-hairline)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span className="mark">
            <i className="ph ph-sparkle" style={{ fontSize: 15 }} />
          </span>
          <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-0.01em" }}>Notify</span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 14 }}>
          <a href="#capabilities" className="muted">
            Tools
          </a>
          <a
            href="https://github.com/vercel/mcp-handler"
            className="muted"
            target="_blank"
            rel="noreferrer"
          >
            Source
          </a>
          <Link href="/dashboard" className="btn btn-primary">
            Open dashboard
          </Link>
        </nav>
      </header>

      <section
        style={{
          position: "relative",
          padding: "104px 72px 88px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)",
          gap: 72,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <span
            className="tag"
            style={{
              alignSelf: "flex-start",
              padding: "5px 12px",
              border: "1px solid color-mix(in srgb, var(--color-accent) 32%, transparent)",
              color: "var(--color-accent-300)",
              fontSize: 12,
            }}
          >
            <i className="ph ph-plugs-connected" style={{ fontSize: 13 }} /> MCP server · notes, tables, alerts
          </span>

          <h1 style={{ fontSize: 60, lineHeight: 1.04, letterSpacing: "-0.03em", maxWidth: "13ch" }}>
            Your data. Your Postgres. Their hands.
          </h1>

          <p className="muted" style={{ fontSize: 17, lineHeight: 1.65, maxWidth: "46ch" }}>
            A personal workspace that speaks MCP. Claude and Gemini create notes, define tables and raise
            alerts against a database you host — and every call they make is on the log.
          </p>

          <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              Open dashboard
            </Link>
            <Link href="/dashboard/connect" className="btn btn-secondary btn-lg">
              <i className="ph ph-book-open-text" style={{ fontSize: 16 }} /> Connection guide
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="eyebrow">Endpoints</div>
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-sm)",
              overflow: "hidden",
            }}
          >
            {ENDPOINTS.map((e, i) => (
              <div
                key={e.path}
                style={{
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  borderTop: i === 0 ? "none" : "1px solid var(--color-hairline)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="mono" style={{ fontSize: 14, color: "var(--color-accent-300)" }}>
                    {e.path}
                  </span>
                  <span className="dim" style={{ fontSize: 12 }}>
                    {e.note}
                  </span>
                </div>
                <i className="ph ph-copy dim" style={{ fontSize: 17 }} />
              </div>
            ))}
          </div>
          <p className="dim" style={{ fontSize: 13, lineHeight: 1.6 }}>
            Authenticate with an API key as a bearer token. Keys are issued and revoked from{" "}
            <Link href="/dashboard/connect">Connect</Link>.
          </p>
        </div>
      </section>

      <section
        id="capabilities"
        style={{
          position: "relative",
          margin: "0 72px 88px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
          background: "var(--color-hairline)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        {CAPABILITIES.map((c) => (
          <div
            key={c.title}
            style={{
              background: "var(--color-bg)",
              padding: "34px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <i className={`ph ${c.icon}`} style={{ fontSize: 22, color: "var(--color-accent)" }} />
            <h3 style={{ fontSize: 17 }}>{c.title}</h3>
            <p className="dim" style={{ fontSize: 14, lineHeight: 1.6 }}>
              {c.body}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
