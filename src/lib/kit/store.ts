// Media kit data: settings live on users/{uid}.kit; the kit itself is built from Instagram stats.
import "server-only";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";
import { getStats, type InstagramSummary } from "@/lib/instagram/store";
import type { InstagramStats } from "@/lib/instagram/stats";
import { DEFAULT_KIT, KitSettings } from "./settings";

export type PublicKit = { summary: InstagramSummary; stats: InstagramStats; settings: KitSettings };

function db() {
  const d = getDb();
  if (!d) throw new Error("Firestore is not configured");
  return d;
}

export async function getKitSettings(uid: string): Promise<KitSettings> {
  const parsed = KitSettings.safeParse((await db().collection(COLLECTIONS.users).doc(uid).get()).get("kit"));
  return parsed.success ? parsed.data : DEFAULT_KIT;
}

export async function saveKitSettings(uid: string, settings: KitSettings): Promise<void> {
  await db().collection(COLLECTIONS.users).doc(uid).set({ kit: settings }, { merge: true });
}

/** The kit for an Instagram username, only if its owner made it public and has stats. */
export async function getPublicKit(username: string): Promise<PublicKit | null> {
  if (!/^[a-z0-9._]{1,30}$/.test(username)) return null;
  const snap = await db().collection(COLLECTIONS.users)
    .where("instagram.username", "==", username)
    .where("kit.public", "==", true)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;

  const settings = KitSettings.safeParse(doc.get("kit"));
  const stats = await getStats(doc.id);
  if (!settings.success || !stats?.avgViews) return null;
  return { summary: doc.get("instagram") as InstagramSummary, stats, settings: settings.data };
}
