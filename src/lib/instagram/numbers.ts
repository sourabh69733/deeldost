// The signed-in creator's real Instagram numbers, for pre-filling the rate and brand-check tools.
import "server-only";
import { getCurrentUser } from "@/lib/server/session";
import { getStats, getSummary } from "./store";

export type InstagramNumbers = { username: string; followers: number; avgViews: number; refreshedAt: number };

/** Null when signed out, not connected, or there aren't enough reels to know typical views. */
export async function getMyInstagramNumbers(): Promise<InstagramNumbers | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const [summary, stats] = await Promise.all([getSummary(user.uid), getStats(user.uid)]);
    if (!summary || !stats?.avgViews || !stats.followers) return null;
    return { username: summary.username, followers: stats.followers, avgViews: stats.avgViews, refreshedAt: stats.refreshedAt };
  } catch (e) {
    console.error("[instagram/numbers] failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
