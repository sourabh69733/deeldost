// Per-visitor limits for endpoints that cost money (AI calls).
// Uses a fixed hourly window stored in Firestore, keyed by a hash of the IP (raw IPs are never stored).
// Fails open: if Firestore is unavailable, the request is allowed.
import "server-only";
import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS, getDb } from "./gcp";

const HOUR_MS = 60 * 60 * 1000;

/** Doc id for this visitor + action + hour window. Exported for tests. */
export function windowKey(action: string, ip: string, now: number): string {
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  return `${action}_${ipHash}_${Math.floor(now / HOUR_MS)}`;
}

/**
 * The caller's IP. Clients can put anything at the start of x-forwarded-for, so we read from the
 * right: each trusted proxy appends one entry. TRUSTED_PROXY_HOPS = number of our proxies after
 * Google's front end (verify on first deploy; see PROJECT.md).
 */
export function clientIp(req: Request, trustedHops = Number(process.env.TRUSTED_PROXY_HOPS ?? 0)): string {
  const hops = (req.headers.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return hops[hops.length - 1 - trustedHops] ?? "unknown";
}

export async function allowRequest(action: string, req: Request, limitPerHour: number): Promise<boolean> {
  const db = getDb();
  if (!db) return true;

  const now = Date.now();
  const ref = db.collection(COLLECTIONS.rateLimits).doc(windowKey(action, clientIp(req), now));
  try {
    return await db.runTransaction(async (tx) => {
      const count = ((await tx.get(ref)).get("count") as number | undefined) ?? 0;
      if (count >= limitPerHour) return false;
      tx.set(ref, {
        count: FieldValue.increment(1),
        // Firestore TTL policy on this field deletes old windows automatically.
        expireAt: Timestamp.fromMillis(now + 2 * HOUR_MS),
      }, { merge: true });
      return true;
    });
  } catch (e) {
    console.error("[rate-limit] failed, allowing request:", e instanceof Error ? e.message : e);
    return true;
  }
}
