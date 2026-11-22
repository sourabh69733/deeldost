// Where Wrapped lives in Firestore:
//   users/{uid}.wrapped               { public } sharing setting
//   users/{uid}/wrapped/{year}        Wrapped snapshot (numbers only, no captions or images)
import "server-only";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";
import type { InstagramSummary } from "@/lib/instagram/store";
import { wrappedYear, type Wrapped } from "./compute";
import { DEFAULT_WRAPPED_SETTINGS, WrappedSettings } from "./settings";

export type PublicWrapped = { wrapped: Wrapped; picture: string | null };

function db() {
  const d = getDb();
  if (!d) throw new Error("Firestore is not configured");
  return d;
}
const userRef = (uid: string) => db().collection(COLLECTIONS.users).doc(uid);
const wrappedRef = (uid: string, year: number) => userRef(uid).collection("wrapped").doc(String(year));

export async function saveWrapped(uid: string, w: Wrapped): Promise<void> {
  await wrappedRef(uid, w.year).set(w);
}

export async function getWrapped(uid: string, year = wrappedYear()): Promise<Wrapped | null> {
  const snap = await wrappedRef(uid, year).get();
  return snap.exists ? (snap.data() as Wrapped) : null;
}

export async function getWrappedSettings(uid: string): Promise<WrappedSettings> {
  const parsed = WrappedSettings.safeParse((await userRef(uid).get()).get("wrapped"));
  return parsed.success ? parsed.data : DEFAULT_WRAPPED_SETTINGS;
}

export async function saveWrappedSettings(uid: string, settings: WrappedSettings): Promise<void> {
  await userRef(uid).set({ wrapped: settings }, { merge: true });
}

/** This year's Wrapped for an Instagram username, only if its owner made it public. */
export async function getPublicWrapped(username: string): Promise<PublicWrapped | null> {
  if (!/^[a-z0-9._]{1,30}$/.test(username)) return null;
  const snap = await db().collection(COLLECTIONS.users)
    .where("instagram.username", "==", username)
    .where("wrapped.public", "==", true)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;
  const wrapped = await getWrapped(doc.id);
  if (!wrapped) return null;
  return { wrapped, picture: (doc.get("instagram") as InstagramSummary | undefined)?.picture ?? null };
}
