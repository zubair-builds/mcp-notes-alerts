"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "notify.prefs";
const DEFAULTS = { desktop: true, pollMs: 5000 };

/**
 * Headless. Polls for notes created since mount and raises a native
 * notification per new note, then refreshes the server components so the
 * overview and notes list pick the row up. Honours the preferences set in
 * /dashboard/settings (same localStorage key).
 */
export function Notifications() {
  const router = useRouter();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [prefs, setPrefs] = useState(DEFAULTS);
  const lastChecked = useRef<number>(Date.now());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore malformed prefs */
    }

    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(setPermission);
      } else {
        setPermission(Notification.permission);
      }
    }
  }, []);

  useEffect(() => {
    if (!prefs.pollMs) return;

    const pollForNotes = async () => {
      try {
        const res = await fetch(`/api/notifications?since=${lastChecked.current}`);
        if (!res.ok) return;

        const data = await res.json();
        const newNotes: Array<{ title: string; createdAt: string }> = data.notes || [];
        if (newNotes.length === 0) return;

        lastChecked.current = Math.max(...newNotes.map((n) => new Date(n.createdAt).getTime()));

        if (prefs.desktop && permission === "granted") {
          newNotes.forEach((note) => {
            new Notification("New note", { body: note.title, icon: "/icon.jpg" });
          });
        }

        router.refresh();
      } catch (err) {
        console.error("Failed to poll notifications:", err);
      }
    };

    const interval = setInterval(pollForNotes, prefs.pollMs);
    return () => clearInterval(interval);
  }, [permission, prefs, router]);

  return null;
}
