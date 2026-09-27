// Server side of usage counting: increments one field on today's metrics doc.
import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { dayKey, type ClientEvent, type ServerEvent } from "@/lib/analytics/events";
import { COLLECTIONS, getDb } from "./gcp";

/** Best-effort: never throws, never slows the caller down meaningfully. */
export async function countEvent(event: ClientEvent | ServerEvent): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.collection(COLLECTIONS.metrics).doc(dayKey()).set({ [event]: FieldValue.increment(1) }, { merge: true });
  } catch (e) {
    console.error("[metrics] failed:", e instanceof Error ? e.message : e);
  }
}
