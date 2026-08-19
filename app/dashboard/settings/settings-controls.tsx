"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "notify.prefs";

type Prefs = { desktop: boolean; pollMs: number };
const DEFAULTS: Prefs = { desktop: true, pollMs: 5000 };

const POLL_OPTIONS = [
  { label: "2s", value: 2000 },
  { label: "5s", value: 5000 },
  { label: "30s", value: 30000 },
  { label: "Off", value: 0 },
];

/** Client-side preferences. Notifications reads the same key. */
export function SettingsControls() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore malformed prefs */
    }
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function toggleDesktop() {
    if (!prefs.desktop) {
      if ("Notification" in window && Notification.permission === "default") {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") return;
      }
      update({ desktop: true });
    } else {
      update({ desktop: false });
    }
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 className="eyebrow" style={{ letterSpacing: "0.1em" }}>
        Notifications
      </h2>

      <div className="setting">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 14.5 }}>Desktop notifications</span>
          <span className="muted" style={{ fontSize: 13 }}>
            {permission === "denied"
              ? "Blocked by the browser — allow notifications for this site first."
              : "Notify me when an agent writes a note or an alert fires."}
          </span>
        </div>
        <button
          className="switch"
          role="switch"
          aria-checked={prefs.desktop && permission !== "denied"}
          aria-label="Desktop notifications"
          data-on={prefs.desktop && permission !== "denied"}
          onClick={toggleDesktop}
          disabled={permission === "denied"}
        >
          <span className="switch-knob" />
        </button>
      </div>

      <div className="setting">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 14.5 }}>Poll interval</span>
          <span className="muted" style={{ fontSize: 13 }}>
            How often the dashboard checks for new rows.
          </span>
        </div>
        <div className="seg">
          {POLL_OPTIONS.map((o) => (
            <button key={o.label} className="seg-opt" data-on={prefs.pollMs === o.value} onClick={() => update({ pollMs: o.value })}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
