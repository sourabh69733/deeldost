// Login sessions: the browser signs in with Firebase (Google), then trades its ID token for an
// httpOnly session cookie. Server code reads the signed-in user from that cookie.
import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth } from "./gcp";

// Firebase hosting products only forward a cookie with this exact name to the server.
export const SESSION_COOKIE = "__session";
const SESSION_DAYS = 14;
// Only accept ID tokens from a sign-in that just happened (Firebase's recommended check).
const MAX_SIGN_IN_AGE_S = 5 * 60;

export type SessionUser = { uid: string; name: string | null; email: string | null; picture: string | null };

/** Verifies a fresh Firebase ID token and returns a session cookie value, or null if invalid. */
export async function createSessionCookie(idToken: string): Promise<{ cookie: string; user: SessionUser; maxAge: number } | null> {
  const auth = getAdminAuth();
  if (!auth) return null;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    if (Date.now() / 1000 - decoded.auth_time > MAX_SIGN_IN_AGE_S) return null;
    const maxAge = SESSION_DAYS * 24 * 60 * 60;
    const cookie = await auth.createSessionCookie(idToken, { expiresIn: maxAge * 1000 });
    return { cookie, maxAge, user: toUser(decoded) };
  } catch (e) {
    console.error("[session] create failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** The signed-in user for this request, or null. Safe to call from any server component or route. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const value = cookies().get(SESSION_COOKIE)?.value;
  const auth = getAdminAuth();
  if (!value || !auth) return null;
  try {
    return toUser(await auth.verifySessionCookie(value));
  } catch {
    return null; // expired or tampered
  }
}

function toUser(t: { uid: string; name?: string; email?: string; picture?: string }): SessionUser {
  return { uid: t.uid, name: t.name ?? null, email: t.email ?? null, picture: t.picture ?? null };
}
