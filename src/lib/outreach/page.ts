// What a creator sees on their personal page (/p/<slug>). Built only from public profile fields and our
// research, never notes, emails or brand lists. Works without AI.
import { buildRateCard, rateCardQuery, type RateCardParams } from "@/lib/pricing/rate-card";
import { NICHES } from "@/lib/pricing/config";
import { ASSUMED_VIEW_RATIO, MIN_FOLLOWERS_FOR_RATE } from "@/lib/people/config";
import type { Person } from "@/lib/people/person";
import { guessNiche, profileText } from "@/lib/people/rules";
import { NICHE_TIPS, SAFETY_TIP, SIZE_TIPS } from "./config";

export type PublicPage = {
  firstName: string;
  name: string | null;
  handle: string | null;
  platform: Person["platform"];
  followers: number | null;
  posts: number | null;
  nicheLabel: string;
  themes: string[];
  rates: { rows: { label: string; price: number }[]; assumedViews: number; imageQuery: string } | null;
  tips: string[];
};

/** "Riya" from "Riya Sharma ✨", or the handle when the name isn't a plain name. */
export function firstName(p: Pick<Person, "name" | "handle">): string {
  const first = (p.name ?? "").replace(/[^\p{L}\p{M}\s'-]/gu, " ").trim().split(/\s+/)[0] ?? "";
  if (first.length >= 2) return first[0].toUpperCase() + first.slice(1);
  return p.handle ? `@${p.handle}` : "there";
}

export function buildPublicPage(p: Person): PublicPage {
  const niche = p.research?.niche ?? guessNiche(profileText(p)).niche;
  // AI themes are plain words; rule themes are hashtags. Show plain words only.
  const themes = (p.research?.themes ?? []).filter((t) => !t.startsWith("#")).slice(0, 3);

  let rates: PublicPage["rates"] = null;
  const platform = p.platform === "instagram" || p.platform === "youtube" ? p.platform : null;
  if (platform && p.followers && p.followers >= MIN_FOLLOWERS_FOR_RATE) {
    const assumedViews = Math.max(1, Math.round(p.followers * ASSUMED_VIEW_RATIO));
    const params: RateCardParams = {
      platform, followers: p.followers, avgViews: assumedViews, niche,
      ...(p.handle && /^[A-Za-z0-9._]{1,30}$/.test(p.handle) ? { handle: p.handle } : {}),
    };
    const card = buildRateCard(params);
    rates = { rows: card.rows.map((r) => ({ label: r.label, price: r.price })), assumedViews, imageQuery: rateCardQuery(params) };
  }

  const size = SIZE_TIPS.find((t) => (p.followers ?? 0) < t.maxFollowers) ?? SIZE_TIPS[SIZE_TIPS.length - 1];
  return {
    firstName: firstName(p),
    name: p.name,
    handle: p.handle,
    platform: p.platform,
    followers: p.followers,
    posts: p.posts,
    nicheLabel: NICHES[niche].label,
    themes,
    rates,
    tips: [size.tip, NICHE_TIPS[niche], SAFETY_TIP],
  };
}
