"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Counts = { notes: number; alerts: number };

const PRIMARY = [
  { href: "/dashboard", label: "Overview", icon: "squares-four", count: null as keyof Counts | null },
  { href: "/dashboard/notes", label: "Notes", icon: "note", count: "notes" as const },
  { href: "/dashboard/alerts", label: "Alerts", icon: "bell", count: "alerts" as const },
];

const SECONDARY = [
  { href: "/dashboard/connect", label: "Connect", icon: "plugs-connected" },
  { href: "/dashboard/activity", label: "Activity log", icon: "pulse" },
  { href: "/dashboard/settings", label: "Settings", icon: "gear-six" },
];

export function Sidebar({
  counts,
  health,
}: {
  counts: Counts;
  health: { clients: number; lastCall: string | null };
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="rail">
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 10px", color: "inherit" }}>
        <span className="mark">
          <i className="ph ph-sparkle" style={{ fontSize: 15 }} />
        </span>
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em" }}>Notify</span>
      </Link>

      <nav className="rail-nav">
        {PRIMARY.map((item) => {
          const active = isActive(item.href);
          const n = item.count ? counts[item.count] : null;
          return (
            <Link key={item.href} href={item.href} className="rail-link" data-active={active}>
              <i className={`${active ? "ph-fill" : "ph"} ph-${item.icon}`} style={{ fontSize: 17 }} />
              {item.label}
              {n !== null && n > 0 && (
                <span className="rail-count" style={item.count === "alerts" ? { color: "var(--color-accent)" } : undefined}>
                  {n}
                </span>
              )}
            </Link>
          );
        })}

        <div className="hairline" style={{ margin: "12px 10px" }} />

        {SECONDARY.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className="rail-link" data-active={active}>
              <i className={`${active ? "ph-fill" : "ph"} ph-${item.icon}`} style={{ fontSize: 17 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          marginTop: "auto",
          padding: 14,
          borderRadius: "var(--radius-md)",
          background: "color-mix(in srgb, var(--color-text) 4%, transparent)",
          display: "flex",
          flexDirection: "column",
          gap: 9,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--color-neutral-300)" }}>
          <span className="dot dot-live" /> Server healthy
        </div>
        <div className="dim" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
          {health.clients} {health.clients === 1 ? "client" : "clients"} connected
          {health.lastCall ? ` · last call ${health.lastCall}` : " · no calls yet"}
        </div>
      </div>
    </aside>
  );
}
