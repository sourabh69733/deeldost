// Turns a year of Instagram posts into Wrapped numbers. Pure and testable; dates use India time.
import { median } from "@/lib/instagram/stats";
import { PERSONA_RULES, VENUES, type PersonaId } from "./config";

export type WrappedMedia = {
  type: string; // REELS, FEED, ...
  timestamp: number;
  likes: number;
  comments: number;
  /** Null when we didn't (or couldn't) fetch views for this post. */
  views: number | null;
  permalink: string | null;
};

export type MonthStat = { month: number; posts: number; views: number };

export type Wrapped = {
  year: number;
  username: string;
  followers: number;
  posts: number;
  reels: number;
  /** Total views across reels we have view counts for. Null if none. */
  views: number | null;
  reelsWithViews: number;
  likes: number;
  comments: number;
  topReel: { views: number; likes: number; comments: number; month: number; permalink: string | null } | null;
  /** Always 12 entries, January first. Objects, because Firestore can't store nested arrays. */
  months: MonthStat[];
  /** Month with the most views, or the most posts if we have no views. */
  bestMonth: number | null;
  /** Weekday with the most posts, 0 = Sunday. */
  busiestDay: number | null;
  /** Most weeks in a row with at least one post. */
  streakWeeks: number;
  persona: PersonaId;
  generatedAt: number;
};

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ist = (ms: number) => new Date(ms + IST_OFFSET_MS);

/** Start of the year in India time, as a UTC timestamp. */
export const yearStartMs = (year: number) => Date.UTC(year, 0, 1) - IST_OFFSET_MS;

/** The year to wrap: the current one, or last year during January. */
export function wrappedYear(now = Date.now()): number {
  const d = ist(now);
  return d.getUTCMonth() === 0 ? d.getUTCFullYear() - 1 : d.getUTCFullYear();
}

/** Monday-based week number since 1970 (day 0 was a Thursday). */
const weekIndex = (ms: number) => Math.floor((Math.floor((ms + IST_OFFSET_MS) / DAY_MS) + 3) / 7);

export function longestStreak(timestamps: number[]): number {
  const weeks = [...new Set(timestamps.map(weekIndex))].sort((a, b) => a - b);
  let best = 0, run = 0;
  weeks.forEach((w, i) => {
    run = i > 0 && w === weeks[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

const argmax = (values: number[]) => {
  const max = Math.max(...values);
  return max > 0 ? values.indexOf(max) : null;
};

export function pickPersona(w: Pick<Wrapped, "likes" | "comments" | "streakWeeks" | "topReel">, reelViews: { views: number; likes: number; comments: number }[]): PersonaId {
  const r = PERSONA_RULES;
  const typical = median(reelViews.map((x) => x.views));
  if (w.topReel && typical && reelViews.length >= 3 && w.topReel.views >= r.viralMinViews && w.topReel.views >= typical * r.viralTimesMedian) return "viral";
  if (w.comments >= r.talkerMinComments && w.likes > 0 && w.comments / w.likes >= r.talkerCommentsPerLike) return "talker";
  if (w.streakWeeks >= r.steadyWeeks) return "steady";
  const eng = median(reelViews.filter((x) => x.views > 0).map((x) => (x.likes + x.comments) / x.views));
  if (eng !== null && eng >= r.lovedEngagement) return "loved";
  return "rising";
}

export function computeWrapped(input: { year: number; username: string; followers: number; media: WrappedMedia[]; now?: number }): Wrapped {
  const start = yearStartMs(input.year), end = yearStartMs(input.year + 1);
  const media = input.media.filter((m) => m.timestamp >= start && m.timestamp < end);
  const reels = media.filter((m) => m.type === "REELS");
  const withViews = reels.filter((m): m is WrappedMedia & { views: number } => m.views !== null && m.views > 0);

  const months: MonthStat[] = Array.from({ length: 12 }, (_, month) => ({ month, posts: 0, views: 0 }));
  const days = Array(7).fill(0) as number[];
  for (const m of media) {
    const d = ist(m.timestamp);
    months[d.getUTCMonth()].posts++;
    months[d.getUTCMonth()].views += m.type === "REELS" ? m.views ?? 0 : 0;
    days[d.getUTCDay()]++;
  }

  const top = [...withViews].sort((a, b) => b.views - a.views)[0];
  const topReel = top ? { views: top.views, likes: top.likes, comments: top.comments, month: ist(top.timestamp).getUTCMonth(), permalink: top.permalink } : null;

  const likes = media.reduce((s, m) => s + m.likes, 0);
  const comments = media.reduce((s, m) => s + m.comments, 0);
  const views = withViews.length ? withViews.reduce((s, m) => s + m.views, 0) : null;
  const streakWeeks = longestStreak(media.map((m) => m.timestamp));

  return {
    year: input.year,
    username: input.username,
    followers: input.followers,
    posts: media.length,
    reels: reels.length,
    views,
    reelsWithViews: withViews.length,
    likes,
    comments,
    topReel,
    months,
    bestMonth: argmax(months.map((m) => (views ? m.views : m.posts))),
    busiestDay: argmax(days),
    streakWeeks,
    persona: pickPersona({ likes, comments, streakWeeks, topReel }, withViews),
    generatedAt: input.now ?? Date.now(),
  };
}

/** "Enough to fill Eden Gardens 3 times". Null when views are too few to be fun. */
export function venueLine(views: number): string | null {
  const v = VENUES.find((x) => views >= x.seats);
  if (!v) return null;
  const times = Math.floor(views / v.seats);
  return `Enough to fill ${v.name} ${times === 1 ? "once" : `${times.toLocaleString("en-IN")} times`}`;
}
