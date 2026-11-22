// Research that works without AI: niche from keywords, public emails, hashtags, and a starting rate estimate.
import { calculateRate } from "@/lib/pricing/calculate";
import type { Deliverable, Niche } from "@/lib/pricing/config";
import { ASSUMED_VIEW_RATIO, GENERIC_TAGS, MIN_FOLLOWERS_FOR_RATE, NICHE_KEYWORDS } from "./config";
import { cleanCaption } from "./extract";
import type { Person } from "./person";

export type RateEstimate = { deliverable: Deliverable; assumedViews: number; low: number; fair: number; high: number };

/** Hashtags that describe content, lowercased, without reach-only tags like #fyp. */
export function hashtags(texts: (string | null | undefined)[]): string[] {
  const tags = new Set<string>();
  for (const t of texts) {
    for (const m of (t ?? "").matchAll(/#([\p{L}\p{M}\p{N}_]{2,40})/gu)) {
      const tag = m[1].toLowerCase();
      // Compare without accents so look-alikes such as "viralreeĺs" are caught too.
      if (!GENERIC_TAGS.has(tag.normalize("NFD").replace(/\p{M}/gu, ""))) tags.add(tag);
    }
  }
  return [...tags];
}

/** Captions in the creator's own words (Instagram's automatic image descriptions removed). */
export const captions = (p: Pick<Person, "recentPosts">) =>
  p.recentPosts.map((r) => cleanCaption(r.caption)).filter((c): c is string => !!c);

/** Text that describes what someone posts. The bio counts three times: it's how they describe themselves. */
export function profileText(p: Pick<Person, "name" | "bio" | "recentPosts">): string {
  return [p.name, p.bio, p.bio, p.bio, ...captions(p)].filter(Boolean).join("\n");
}

export type NicheGuess = { niche: Niche; hits: number; confident: boolean };

/**
 * Niche with the most keyword hits, or "other". Confident when it has 2+ hits and clearly beats the
 * next niche; otherwise AI decides. Ties go to the earlier niche in NICHE_KEYWORDS.
 */
export function guessNiche(text: string): NicheGuess {
  const lower = text.toLowerCase();
  const scores = (Object.entries(NICHE_KEYWORDS) as [Niche, readonly string[]][]).map(([niche, words]) => ({
    niche,
    hits: words.reduce((n, w) => n + (lower.match(new RegExp(`(^|[^\\p{L}\\p{M}])${w}`, "gu"))?.length ?? 0), 0),
  }));
  const sorted = [...scores].sort((a, b) => b.hits - a.hits);
  const [best, next] = sorted;
  if (!best.hits) return { niche: "other", hits: 0, confident: false };
  return { niche: best.niche, hits: best.hits, confident: best.hits >= 2 && best.hits >= next.hits * 1.5 };
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const NOT_EMAIL = /\.(png|jpe?g|gif|webp|svg)$|@(example|sentry|wixpress|domain)\./i;

/** Public email addresses written in the bio or on their pages. */
export function findEmails(texts: (string | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const t of texts) {
    for (const m of (t ?? "").matchAll(EMAIL_RE)) {
      const e = m[0].toLowerCase().replace(/^mailto:/, "");
      if (!NOT_EMAIL.test(e)) out.add(e);
    }
  }
  return [...out].slice(0, 5);
}

/** Price range for one Reel (or YouTube integration), assuming typical views for their follower count. */
export function estimateRate(p: Pick<Person, "platform" | "followers">, niche: Niche): RateEstimate | null {
  const deliverable: Deliverable | null = p.platform === "instagram" ? "reel" : p.platform === "youtube" ? "yt_integration" : null;
  if (!deliverable || !p.followers || p.followers < MIN_FOLLOWERS_FOR_RATE) return null;
  const assumedViews = Math.round(p.followers * ASSUMED_VIEW_RATIO);
  const r = calculateRate({ deliverable, followers: p.followers, avgViews: assumedViews, niche, addOns: [] });
  return { deliverable, assumedViews, low: r.low, fair: r.fair, high: r.high };
}

/** Links worth reading for research: their website or link page, not other social profiles. */
export function researchLinks(p: Pick<Person, "platform" | "url" | "links">, max = 2): string[] {
  const SKIP = /(^|\.)(instagram\.com|youtube\.com|youtu\.be|x\.com|twitter\.com|linkedin\.com|facebook\.com|threads\.net|wa\.me|t\.me|whatsapp\.com)$/;
  const all = p.platform === "website" ? [p.url, ...p.links] : p.links;
  return all.filter((l) => {
    try {
      const u = new URL(l);
      return (u.protocol === "https:" || u.protocol === "http:") && !SKIP.test(u.hostname.replace(/^www\./, ""));
    } catch {
      return false;
    }
  }).slice(0, max);
}
