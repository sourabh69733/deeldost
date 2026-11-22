// Extension keys. The extension can't use the site's login cookie, so an admin makes a key in /admin and
// pastes it into the extension. We store only a hash of the key; making a new key turns off the old one.
//   captureTokens/{sha256(key)}      { uid, email, createdAt }
//   users/{uid}.captureTokenHash     current key's hash, to remove it when a new one is made
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";
import { isAdminEmail } from "@/lib/server/admin";
import type { SessionUser } from "@/lib/server/session";

const PREFIX = "dd_";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const looksLikeToken = (token: string) => /^dd_[A-Za-z0-9_-]{43}$/.test(token);

function db() {
  const d = getDb();
  if (!d) throw new Error("Firestore is not configured");
  return d;
}

/** Makes a new key for this admin and turns off their old one. The key is shown once. */
export async function createCaptureToken(user: SessionUser): Promise<string> {
  const token = PREFIX + randomBytes(32).toString("base64url");
  const hash = hashToken(token);
  const userRef = db().collection(COLLECTIONS.users).doc(user.uid);
  const old = (await userRef.get()).get("captureTokenHash") as string | undefined;
  const batch = db().batch();
  if (old) batch.delete(db().collection(COLLECTIONS.captureTokens).doc(old));
  batch.set(db().collection(COLLECTIONS.captureTokens).doc(hash), { uid: user.uid, email: user.email, createdAt: Date.now() });
  batch.set(userRef, { captureTokenHash: hash }, { merge: true });
  await batch.commit();
  return token;
}

/** The admin a key belongs to, or null. Checks the admin list again, so removing an email locks the key out. */
export async function verifyCaptureToken(token: string): Promise<{ uid: string; email: string } | null> {
  if (!looksLikeToken(token)) return null;
  const snap = await db().collection(COLLECTIONS.captureTokens).doc(hashToken(token)).get();
  const uid = snap.get("uid") as string | undefined;
  const email = snap.get("email") as string | undefined;
  return uid && email && isAdminEmail(email) ? { uid, email } : null;
}

/** Bearer key from an Authorization header. */
export function bearerToken(req: Request): string | null {
  const m = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(\S+)$/i);
  return m ? m[1] : null;
}
