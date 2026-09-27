// Turns raw Instagram data into the numbers creators and brands care about. Pure and testable.

export type ReelSample = { views: number; likes: number; comments: number };

/** One audience group and its share of followers (0..1). Objects, because Firestore can't store nested arrays. */
export type Share = { label: string; share: number };

export type InstagramStats = {
  followers: number;
  /** Median views of recent reels. Median, so one viral reel doesn't inflate prices. */
  avgViews: number | null;
  reelsCounted: number;
  /** Median (likes + comments) / views across recent reels, e.g. 0.042 = 4.2%. */
  engagementRate: number | null;
  audience: {
    cities: Share[];
    countries: Share[];
    age: Share[];
    gender: Share[];
  } | null;
  refreshedAt: number;
};

// How many recent reels to sample. Enough to be stable, few enough to stay fast.
export const REELS_SAMPLE = 12;

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Top N groups by count, largest first, as shares of the total. */
export function topShares(rows: [string, number][], n = 5): Share[] {
  const total = rows.reduce((sum, [, v]) => sum + v, 0);
  if (!total) return [];
  return [...rows].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, v]) => ({ label, share: Math.round((v / total) * 1000) / 1000 }));
}

export function computeStats(
  followers: number,
  reels: ReelSample[],
  demographics: { city: [string, number][]; country: [string, number][]; age: [string, number][]; gender: [string, number][] } | null,
  now = Date.now(),
): InstagramStats {
  const withViews = reels.filter((r) => r.views > 0);
  const avg = median(withViews.map((r) => r.views));
  const eng = median(withViews.map((r) => (r.likes + r.comments) / r.views));
  return {
    followers,
    avgViews: avg === null ? null : Math.round(avg),
    reelsCounted: withViews.length,
    engagementRate: eng === null ? null : Math.round(eng * 10000) / 10000,
    audience: demographics && {
      cities: topShares(demographics.city),
      countries: topShares(demographics.country),
      age: topShares(demographics.age, 7),
      gender: topShares(demographics.gender, 3),
    },
    refreshedAt: now,
  };
}
