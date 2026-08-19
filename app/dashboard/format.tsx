/** Shared date/number formatting for the dashboard. */

export function relativeTime(value: Date | string): string {
  const then = new Date(value).getTime();
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(value).toLocaleDateString();
}

export function absoluteTime(value: Date | string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function excerpt(text: string, chars = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > chars ? `${clean.slice(0, chars).trimEnd()}…` : clean;
}
