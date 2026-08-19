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
    <main style={{ maxWidth: 360, margin: "120px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 20 }}>Dashboard login</h1>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Dashboard password"
          autoFocus
          style={{ padding: 10, borderRadius: 6, border: "1px solid #2a2f3a", background: "#171a21", color: "#e6e8eb" }}
        />
        {error && <p style={{ color: "#f87171", margin: 0, fontSize: 14 }}>{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          style={{ padding: 10, borderRadius: 6, border: "none", background: "#7dd3fc", color: "#0b0d12", fontWeight: 600 }}
        >
          {submitting ? "Checking..." : "Log in"}
        </button>
      </form>
    </main>
  );
}
