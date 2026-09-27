// Pulls fresh numbers from Instagram and saves a stats snapshot.
import "server-only";
import { InstagramApiError, getFollowerDemographics, getMediaInsights, getProfile, getRecentMedia, type Breakdown } from "./api";
import { REELS_SAMPLE, computeStats, type InstagramStats } from "./stats";
import { getAccessToken, markNeedsReconnect, saveStats } from "./store";

// Instagram only returns demographics for accounts with at least this many followers.
const DEMOGRAPHICS_MIN_FOLLOWERS = 100;

export async function syncStats(uid: string): Promise<InstagramStats> {
  try {
    const token = await getAccessToken(uid);
    if (!token) throw new InstagramApiError("Instagram is not connected");

    const [profile, media] = await Promise.all([getProfile(token), getRecentMedia(token)]);
    const reels = media.filter((m) => m.media_product_type === "REELS").slice(0, REELS_SAMPLE);

    // One failed reel or breakdown shouldn't sink the whole refresh.
    const insights = await Promise.allSettled(reels.map((r) => getMediaInsights(token, r.id)));
    const samples = reels.map((r, i) => {
      const ins = insights[i];
      return {
        views: ins.status === "fulfilled" ? ins.value.views ?? 0 : 0,
        likes: r.like_count ?? 0,
        comments: r.comments_count ?? 0,
      };
    });

    let demographics = null;
    if (profile.followers_count >= DEMOGRAPHICS_MIN_FOLLOWERS) {
      const dims: Breakdown[] = ["city", "country", "age", "gender"];
      const results = await Promise.allSettled(dims.map((d) => getFollowerDemographics(token, d)));
      const get = (i: number) => (results[i].status === "fulfilled" ? (results[i] as PromiseFulfilledResult<[string, number][]>).value : []);
      if (results.some((r) => r.status === "fulfilled")) {
        demographics = { city: get(0), country: get(1), age: get(2), gender: get(3) };
      }
    }

    const stats = computeStats(profile.followers_count, samples, demographics);
    await saveStats(uid, stats, profile);
    return stats;
  } catch (e) {
    if (e instanceof InstagramApiError && e.needsReconnect) await markNeedsReconnect(uid);
    throw e;
  }
}
