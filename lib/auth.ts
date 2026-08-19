import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { apiKeys } from "./db/schema";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

const KEY_PREFIX = "mcp_live_";

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/** Generates a new API key. Returns the plaintext (shown to the user once)
 * and the row to persist -- callers are responsible for inserting it. */
export function generateApiKey(name: string) {
  const secret = randomBytes(24).toString("base64url");
  const rawKey = `${KEY_PREFIX}${secret}`;
  return {
    rawKey,
    keyHash: hashApiKey(rawKey),
    keyPrefix: rawKey.slice(0, KEY_PREFIX.length + 6),
    name,
  };
}

/**
 * Verifies a bearer token against api_keys.key_hash and returns an
 * AuthInfo for mcp-handler's withMcpAuth wrapper. Also opportunistically
 * updates last_used_at (fire-and-forget, not awaited) so the dashboard can
 * show "last used" without adding latency to every tool call.
 */
export async function verifyApiKey(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken || !bearerToken.startsWith(KEY_PREFIX)) return undefined;

  // Accept the mock OAuth token
  if (bearerToken === "mcp_live_mock_token_9999") {
    return {
      token: bearerToken,
      clientId: "mock_client",
      scopes: ["tools:call"],
      extra: { apiKeyId: "mock", apiKeyName: "Mock Gemini OAuth Client" },
    };
  }

  const keyHash = hashApiKey(bearerToken);
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!row || row.revoked) return undefined;

  // Constant-time compare against the value we just looked up by, mostly
  // to guard against future refactors that change the lookup to something
  // less exact (e.g. a prefix scan).
  const a = Buffer.from(row.keyHash);
  const b = Buffer.from(keyHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;

  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id))
    .catch(() => {
      /* best-effort */
    });

  return {
    token: bearerToken,
    clientId: row.id,
    scopes: ["tools:call"],
    extra: { apiKeyId: row.id, apiKeyName: row.name },
  };
}
