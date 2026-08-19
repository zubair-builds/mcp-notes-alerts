"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { excerpt, relativeTime } from "../format";

export type NoteRow = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: string | null;
};

type Draft = { id: string | null; title: string; content: string };

const EMPTY: Draft = { id: null, title: "", content: "" };

export function NotesWorkspace({ notes }: { notes: NoteRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "agents" | "mine">("all");
  const [draft, setDraft] = useState<Draft>(() =>
    params.get("new") ? EMPTY : notes[0] ? { id: notes[0].id, title: notes[0].title, content: notes[0].content } : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const selected = useMemo(() => notes.find((n) => n.id === draft.id) ?? null, [notes, draft.id]);
  const dirty = selected ? selected.title !== draft.title || selected.content !== draft.content : Boolean(draft.title || draft.content);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (filter === "agents" && !n.author) return false;
      if (filter === "mine" && n.author) return false;
      if (!q) return true;
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    });
  }, [notes, query, filter]);

  useEffect(() => {
    if (!draft.id) titleRef.current?.focus();
  }, [draft.id]);

  function open(note: NoteRow) {
    setDraft({ id: note.id, title: note.title, content: note.content });
    setSavedAt(null);
  }

  async function save() {
    if (!draft.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/notes", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: draft.id, title: draft.title.trim(), content: draft.content }),
    });
    setSaving(false);
    if (!res.ok) return;
    const data = await res.json();
    setDraft((d) => ({ ...d, id: data.id }));
    setSavedAt(new Date().toISOString());
    router.refresh();
  }

  async function remove() {
    if (!draft.id) return setDraft(EMPTY);
    setSaving(true);
    await fetch("/api/notes", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: draft.id }),
    });
    setSaving(false);
    setDraft(EMPTY);
    router.refresh();
  }

  const wordCount = draft.content.trim() ? draft.content.trim().split(/\s+/).length : 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "330px minmax(0, 1fr)",
        gap: 0,
        margin: "-44px -56px -64px",
        minHeight: "100vh",
      }}
    >
      <div style={{ borderRight: "1px solid var(--color-hairline)", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "26px 22px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            borderBottom: "1px solid var(--color-hairline)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ fontSize: 20 }}>Notes</h1>
            <button
              className="btn btn-primary btn-icon"
              onClick={() => {
                setDraft(EMPTY);
                setSavedAt(null);
              }}
              aria-label="New note"
              style={{ width: 30, height: 30 }}
            >
              <i className="ph ph-plus" style={{ fontSize: 15 }} />
            </button>
          </div>

          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <i
              className="ph ph-magnifying-glass dim"
              style={{ position: "absolute", left: 12, fontSize: 15, pointerEvents: "none" }}
            />
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${notes.length} notes`}
              style={{ padding: "9px 12px 9px 34px", fontSize: 13.5 }}
            />
          </div>

          <div style={{ display: "flex", gap: 7 }}>
            {(["all", "agents", "mine"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`tag ${filter === f ? "tag-accent" : "tag-outline"}`}
                style={{ fontSize: 12, padding: "4px 11px", cursor: "pointer", background: filter === f ? undefined : "none" }}
              >
                {f === "all" ? "All" : f === "agents" ? "By agents" : "By me"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {visible.length === 0 ? (
            <p className="dim" style={{ fontSize: 13, padding: "24px 22px" }}>
              {notes.length === 0 ? "No notes yet — ask Claude or Gemini to save one." : "Nothing matches that search."}
            </p>
          ) : (
            visible.map((n, i) => {
              const active = n.id === draft.id;
              return (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className={active ? undefined : "row-hover"}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    width: "100%",
                    textAlign: "left",
                    padding: "17px 22px",
                    border: "none",
                    borderTop: i === 0 ? "none" : "1px solid color-mix(in srgb, #e9e9ed 7%, transparent)",
                    borderLeft: active ? "2px solid var(--color-accent)" : "2px solid transparent",
                    background: active ? "color-mix(in srgb, var(--color-accent) 10%, transparent)" : "transparent",
                    color: "inherit",
                    cursor: "pointer",
                    font: "inherit",
                  }}
                >
                  <span style={{ fontSize: 14, color: active ? "var(--color-accent-100)" : "var(--color-neutral-200)" }}>
                    {n.title}
                  </span>
                  <span
                    className="muted"
                    style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}
                  >
                    {excerpt(n.content, 60)}
                  </span>
                  <span className="dim" style={{ fontSize: 11.5, marginTop: 2 }}>
                    {relativeTime(n.updatedAt)} · {n.author ?? "me"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            padding: "22px 44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            borderBottom: "1px solid var(--color-hairline)",
          }}
        >
          <div className="muted" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
            <i className="ph ph-sparkle" style={{ fontSize: 14, color: "var(--color-accent)" }} />
            {selected
              ? `${selected.author ? `Written by ${selected.author}` : "Written by you"} · updated ${relativeTime(selected.updatedAt)}`
              : "New note"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn btn-secondary btn-icon" onClick={remove} disabled={saving} aria-label="Delete note">
              <i className="ph ph-trash" style={{ fontSize: 15 }} />
            </button>
            <button className="btn btn-primary" onClick={save} disabled={saving || !dirty || !draft.title.trim()}>
              {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            </button>
          </div>
        </div>

        <div style={{ padding: "48px 44px", display: "flex", flexDirection: "column", gap: 22, flex: 1 }}>
          <textarea
            ref={titleRef}
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Untitled note"
            rows={1}
            style={{
              fontSize: 30,
              fontFamily: "var(--font-heading)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              background: "none",
              border: "none",
              color: "var(--color-text)",
              resize: "none",
              padding: 0,
            }}
          />
          <textarea
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            placeholder="Write, or let an agent fill this in."
            style={{
              flex: 1,
              minHeight: 340,
              fontSize: 15.5,
              lineHeight: 1.75,
              fontFamily: "var(--font-body)",
              color: "var(--color-neutral-300)",
              background: "none",
              border: "none",
              resize: "none",
              padding: 0,
              maxWidth: "66ch",
            }}
          />
        </div>

        <div
          style={{
            padding: "18px 44px",
            borderTop: "1px solid var(--color-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--color-neutral-600)",
          }}
        >
          <span className="mono">
            {selected ? `${selected.id.slice(0, 8)} · created ${new Date(selected.createdAt).toLocaleString()} · ` : ""}
            {wordCount} words
          </span>
          <span>{savedAt ? `Saved ${relativeTime(savedAt)}` : dirty ? "Unsaved changes" : "Up to date"}</span>
        </div>
      </div>
    </div>
  );
}
