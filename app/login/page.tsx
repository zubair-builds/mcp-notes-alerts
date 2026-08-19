"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Incorrect password");
      return;
    }
    router.push(params.get("next") || "/dashboard");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <aside
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "56px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid var(--color-hairline)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(560px 400px at 12% 108%, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent 72%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 11 }}>
          <span className="mark">
            <i className="ph ph-sparkle" style={{ fontSize: 15 }} />
          </span>
          <span style={{ fontSize: 16, fontWeight: 500 }}>Notify</span>
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16, maxWidth: "34ch" }}>
          <h2 style={{ fontSize: 34, lineHeight: 1.18 }}>Everything the agents wrote is waiting inside.</h2>
          <p className="muted" style={{ fontSize: 14 }}>
            One password, one operator. Sessions last 30 days.
          </p>
        </div>
      </aside>

      <div style={{ display: "grid", placeItems: "center", padding: 64 }}>
        <form onSubmit={onSubmit} style={{ width: 344, display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <h1 style={{ fontSize: 24 }}>Sign in</h1>
            <p className="muted" style={{ fontSize: 14 }}>
              Enter your dashboard password to continue.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <i
                  className="ph ph-lock-simple dim"
                  style={{ position: "absolute", left: 13, fontSize: 16, pointerEvents: "none" }}
                />
                <input
                  id="password"
                  className="input"
                  type={reveal ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dashboard password"
                  autoFocus
                  style={{ padding: "12px 42px 12px 38px" }}
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? "Hide password" : "Show password"}
                  className="btn btn-ghost"
                  style={{ position: "absolute", right: 4, width: 30, height: 30, padding: 0 }}
                >
                  <i className={`ph ${reveal ? "ph-eye-slash" : "ph-eye"}`} style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: "var(--color-danger)", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
                <i className="ph ph-warning-circle" style={{ fontSize: 15 }} /> {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: 12, fontSize: 14 }}>
              {submitting ? "Checking…" : "Log in"}
            </button>
          </div>

          <div className="rule-fade" />

          <p className="dim" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            Clients don&apos;t sign in here — they authenticate with a bearer key from Connect.
          </p>
        </form>
      </div>
    </main>
  );
}
