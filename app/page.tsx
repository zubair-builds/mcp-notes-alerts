import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "80px auto", padding: "0 24px" }}>
      <h1>MCP MVP</h1>
      <p style={{ color: "#9aa3ad" }}>
        A personal MCP server with notes, alerts, and a call-log dashboard.
      </p>
      <p>
        Connect Claude to <code>/api/mcp</code> (Streamable HTTP) or <code>/api/sse</code> (SSE) with
        an API key as a bearer token. Manage keys from the{" "}
        <Link href="/dashboard" style={{ color: "#7dd3fc" }}>
          dashboard
        </Link>
        .
      </p>
    </main>
  );
}
