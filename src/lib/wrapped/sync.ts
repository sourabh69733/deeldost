// Pulls this year's posts from Instagram and saves a Wrapped snapshot.
import "server-only";
import { InstagramApiError, getMediaInsights, getMediaSince, getProfile, parseIgTime } from "@/lib/instagram/api";
import { getAccessToken, markNeedsReconnect } from "@/lib/instagram/store";
import { computeWrapped, wrappedYear, yearStartMs, type Wrapped } from "./compute";
import { INSIGHTS_CAP, MEDIA_CAP } from "./config";
import { saveWrapped } from "./store";

/** Runs fn over items with at most `limit` in flight. Failures come back as null. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<(R | null)[]> {
  const out: (R | null)[] = Array(items.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]).catch(() => null);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function syncWrapped(uid: string, now = Date.now()): Promise<Wrapped> {
  try {
    const token = await getAccessToken(uid);
    if (!token) throw new InstagramApiError("Instagram is not connected");

    const year = wrappedYear(now);
    const [profile, media] = await Promise.all([getProfile(token), getMediaSince(token, yearStartMs(year), MEDIA_CAP)]);

    // Views need one call per reel, so only the latest INSIGHTS_CAP reels get them.
    const reelIds = media.filter((m) => m.media_product_type === "REELS").slice(0, INSIGHTS_CAP).map((m) => m.id);
    const insights = await mapLimit(reelIds, 6, (id) => getMediaInsights(token, id));
    const views = new Map(reelIds.map((id, i) => [id, insights[i]?.views ?? null]));

    const wrapped = computeWrapped({
      year,
      username: profile.username,
      followers: profile.followers_count,
      now,
      media: media.map((m) => ({
        type: m.media_product_type ?? "FEED",
        timestamp: parseIgTime(m.timestamp),
        likes: m.like_count ?? 0,
        comments: m.comments_count ?? 0,
        views: views.get(m.id) ?? null,
        permalink: m.permalink ?? null,
      })),
    });
    await saveWrapped(uid, wrapped);
    return wrapped;
  } catch (e) {
    if (e instanceof InstagramApiError && e.needsReconnect) await markNeedsReconnect(uid);
    throw e;
  }
}
