/**
 * Minimal signed-cookie session for the dashboard. This is intentionally
 * NOT a general-purpose auth system -- it's a single shared password
 * (DASHBOARD_PASSWORD) gating /dashboard and /api/keys, matching the
 * "solo/personal use" scope of this MVP. Swap for real auth (Clerk,
 * NextAuth, etc.) before letting anyone else in.
 *
 * Built on Web Crypto (crypto.subtle) rather than node:crypto because
 * this module is imported from middleware.ts, which Next.js runs on the
 * Edge runtime by default -- node:crypto isn't available there.
 */

const COOKIE_NAME = "mcp_dashboard_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set. Copy .env.example to .env.");
  return secret;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(value: string): Promise<string> {
  const key = await getHmacKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bufferToHex(sig);
}

/** Constant-time string comparison (both inputs are expected to be
 * equal-length hex digests, but this is safe even if lengths differ). */
function timingSafeEqualStr(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export async function createSessionCookieValue(): Promise<string> {
  const issuedAt = Date.now().toString();
  const signature = await sign(issuedAt);
  return `${issuedAt}.${signature}`;
}

export async function isValidSessionCookieValue(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;

  const expected = await sign(issuedAt);
  if (!timingSafeEqualStr(signature, expected)) return false;

  const ageSeconds = (Date.now() - Number(issuedAt)) / 1000;
  return ageSeconds >= 0 && ageSeconds <= MAX_AGE_SECONDS;
}

export function checkDashboardPassword(candidate: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) throw new Error("DASHBOARD_PASSWORD is not set. Copy .env.example to .env.");
  return timingSafeEqualStr(candidate, expected);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = MAX_AGE_SECONDS;
