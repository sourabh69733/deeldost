// Research pipeline for one saved person: rules first (niche, emails, rate), then their public links,
// then Claude. Each step is optional; the result is always useful. Page text is used and dropped, never stored.
import type { Niche } from "@/lib/pricing/config";
import type { AiResearch, AiResearchInput } from "./ai-research";
import { readHtml, type PageInfo } from "./html";
import type { Person } from "./person";
import { captions, estimateRate, findEmails, guessNiche, hashtags, profileText, researchLinks, type RateEstimate } from "./rules";

export type Research = {
  niche: Niche;
  nicheSource: "rules" | "ai";
  themes: string[];
  summary: string | null;
  audience: string | null;
  location: string | null;
  languages: string[];
  brands: string[];
  pitch: string | null;
  emails: string[];
  rate: RateEstimate | null;
  /** Pages we read for this research. */
  sources: string[];
  usedAi: boolean;
  researchedAt: number;
};

export type ResearchDeps = {
  fetchPage: (url: string) => Promise<{ url: string; html: string } | null>;
  ai: (input: AiResearchInput) => Promise<AiResearch | null>;
  now?: number;
};

export async function runResearch(p: Person, deps: ResearchDeps): Promise<Research> {
  const text = profileText(p);
  const tags = hashtags([p.bio, ...captions(p)]);

  const fetched = await Promise.all(researchLinks(p).map(async (url) => {
    const page = await deps.fetchPage(url);
    return page ? { url: page.url, ...readHtml(page.html, page.url) } : null;
  }));
  const pages = fetched.filter((x): x is PageInfo & { url: string } => !!x);

  const rules = guessNiche([text, ...pages.map((pg) => `${pg.title ?? ""}\n${pg.description ?? ""}`)].join("\n"));
  const ai = await deps.ai({
    platform: p.platform,
    handle: p.handle,
    name: p.name,
    bio: p.bio,
    followers: p.followers,
    posts: p.posts,
    captions: captions(p).slice(0, 12),
    hashtags: tags.slice(0, 40),
    ruleNiche: rules.niche,
    pages: pages.map((pg) => ({ url: pg.url, title: pg.title, description: pg.description, text: pg.text.slice(0, 2500) })),
  });

  // AI picks the niche only when rules found nothing clear.
  const useRules = rules.confident || !ai;
  const niche = useRules ? rules.niche : ai.niche;
  const mailtos = pages.flatMap((pg) => pg.links.filter((l) => l.startsWith("mailto:")).map((l) => {
    try {
      return decodeURIComponent(l.slice(7).split("?")[0]);
    } catch {
      return "";
    }
  }));

  return {
    niche,
    nicheSource: useRules ? "rules" : "ai",
    themes: ai?.themes ?? tags.slice(0, 5).map((t) => `#${t}`),
    summary: ai?.summary ?? null,
    audience: ai?.audience ?? null,
    location: ai?.location ?? null,
    languages: ai?.languages ?? [],
    brands: ai?.brands ?? [],
    pitch: ai?.pitch ?? null,
    emails: findEmails([p.bio, ...mailtos, ...pages.map((pg) => pg.text)]),
    rate: estimateRate(p, niche),
    sources: pages.map((pg) => pg.url),
    usedAi: !!ai,
    researchedAt: deps.now ?? Date.now(),
  };
}
