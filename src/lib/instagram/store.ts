// Where Instagram data lives in Firestore:
//   users/{uid}.instagram           summary shown in the UI (username, picture, connectedAt, needsReconnect)
//   users/{uid}/private/instagram   encrypted access token + expiry (server only, never sent to the browser)
//   users/{uid}/stats/instagram     latest InstagramStats snapshot
//   igAccounts/{igUserId}           { uid }: one Instagram account links to one DealDost user (webhooks use this later)
//   oauthStates/{state}             { uid, expireAt }: one-time login state, TTL-deleted
import "server-only";
import { randomBytes } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";
import { decrypt, encrypt } from "@/lib/server/crypto";
import { refreshToken, type Profile } from "./api";
import type { InstagramStats } from "./stats";

export type InstagramSummary = {
  igUserId: string;
  username: string;
  picture: string | null;
  accountType: string | null;
  connectedAt: number;
  needsReconnect?: boolean;
};

/** Thrown when this Instagram account is already linked to another DealDost user. */
export class AlreadyLinkedError extends Error {}

const STATE_TTL_MS = 10 * 60 * 1000;
// Refresh tokens when they have less than this left (they last 60 days).
const REFRESH_WHEN_LEFT_MS = 10 * 24 * 60 * 60 * 1000;

function db() {
  const d = getDb();
  if (!d) throw new Error("Firestore is not configured");
  return d;
}
const userRef = (uid: string) => db().collection(COLLECTIONS.users).doc(uid);
const tokenRef = (uid: string) => userRef(uid).collection("private").doc("instagram");
const statsRef = (uid: string) => userRef(uid).collection("stats").doc("instagram");

// ---- OAuth state ------------------------------------------------------------

export async function createOAuthState(uid: string): Promise<string> {
  const state = randomBytes(24).toString("base64url");
  await db().collection(COLLECTIONS.oauthStates).doc(state).set({
    uid,
    expireAt: Timestamp.fromMillis(Date.now() + STATE_TTL_MS),
  });
  return state;
}

/** True if the state was issued to this user and hasn't expired. Each state works once. */
export async function consumeOAuthState(state: string, uid: string): Promise<boolean> {
  if (!/^[\w-]{20,64}$/.test(state)) return false;
  const ref = db().collection(COLLECTIONS.oauthStates).doc(state);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    tx.delete(ref);
    return snap.get("uid") === uid && (snap.get("expireAt") as Timestamp).toMillis() > Date.now();
  });
}

// ---- Connection ------------------------------------------------------------

export async function saveConnection(
  uid: string,
  conn: { token: string; expiresAt: number; permissions: string[]; profile: Profile },
): Promise<void> {
  const igUserId = conn.profile.user_id;
  const mapRef = db().collection(COLLECTIONS.igAccounts).doc(igUserId);
  const summary: InstagramSummary = {
    igUserId,
    username: conn.profile.username,
    picture: conn.profile.profile_picture_url ?? null,
    accountType: conn.profile.account_type ?? null,
    connectedAt: Date.now(),
  };

  await db().runTransaction(async (tx) => {
    const owner = (await tx.get(mapRef)).get("uid") as string | undefined;
    if (owner && owner !== uid) throw new AlreadyLinkedError("This Instagram account is linked to another DealDost account.");
    tx.set(mapRef, { uid, updatedAt: FieldValue.serverTimestamp() });
    tx.set(userRef(uid), { instagram: summary }, { merge: true });
    tx.set(tokenRef(uid), {
      tokenEnc: encrypt(conn.token),
      expiresAt: conn.expiresAt,
      refreshedAt: Date.now(),
      permissions: conn.permissions,
    });
  });
}

export async function getSummary(uid: string): Promise<InstagramSummary | null> {
  return ((await userRef(uid).get()).get("instagram") as InstagramSummary | undefined) ?? null;
}

export async function markNeedsReconnect(uid: string): Promise<void> {
  await userRef(uid).set({ instagram: { needsReconnect: true } }, { merge: true });
}

/** A usable access token, refreshed first if it's close to expiring. Null if not connected. */
export async function getAccessToken(uid: string): Promise<string | null> {
  const snap = await tokenRef(uid).get();
  if (!snap.exists) return null;
  const token = decrypt(snap.get("tokenEnc"));
  const expiresAt = snap.get("expiresAt") as number;
  const refreshedAt = snap.get("refreshedAt") as number;

  const dayOld = Date.now() - refreshedAt > 24 * 60 * 60 * 1000;
  if (expiresAt - Date.now() < REFRESH_WHEN_LEFT_MS && dayOld) {
    const fresh = await refreshToken(token);
    await tokenRef(uid).update({ tokenEnc: encrypt(fresh.token), expiresAt: fresh.expiresAt, refreshedAt: Date.now() });
    return fresh.token;
  }
  return token;
}

/** Removes the token, stats, summary and account link. */
export async function disconnect(uid: string): Promise<void> {
  const summary = await getSummary(uid);
  const batch = db().batch();
  batch.delete(tokenRef(uid));
  batch.delete(statsRef(uid));
  batch.update(userRef(uid), { instagram: FieldValue.delete() });
  if (summary?.igUserId) batch.delete(db().collection(COLLECTIONS.igAccounts).doc(summary.igUserId));
  await batch.commit();
}

// ---- Stats -----------------------------------------------------------------

export async function saveStats(uid: string, stats: InstagramStats, profile: Profile): Promise<void> {
  const batch = db().batch();
  batch.set(statsRef(uid), stats);
  batch.set(userRef(uid), {
    instagram: {
      username: profile.username,
      picture: profile.profile_picture_url ?? null,
      needsReconnect: false,
    },
  }, { merge: true });
  await batch.commit();
}

export async function getStats(uid: string): Promise<InstagramStats | null> {
  const snap = await statsRef(uid).get();
  return snap.exists ? (snap.data() as InstagramStats) : null;
}
