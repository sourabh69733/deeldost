import { describe, expect, it, vi } from "vitest";
import type { AiResearch, AiResearchInput } from "./ai-research";
import { profileFromUrl, type ExtractedProfile } from "./extract";
import { mergeProfile, type Person } from "./person";
import { runResearch } from "./research";

const person: Person = mergeProfile(null, {
  ...(profileFromUrl("instagram.com/riya") as ExtractedProfile),
  name: "Riya",
  bio: "Travel . lifestyle\nCollabs: riya@mail.com",
  followers: 50_000,
  links: ["https://linktr.ee/riya", "https://youtube.com/@riya"],
  recentPosts: [{ url: "https://www.instagram.com/p/A/", caption: "Sunrise trek #travel #mountains" }],
}, { source: "extension", now: 1 });

const LINKTREE = `<title>Riya | Linktree</title><a href="mailto:work@riya.in">Work</a><p>Travel stories</p>`;

const aiNote: AiResearch = {
  niche: "lifestyle", themes: ["Treks", "Cafés"], summary: "Posts treks.", audience: "Young travellers",
  location: "Jaipur", languages: ["Hindi", "English"], brands: ["Wildcraft"], pitch: "Price your travel collabs.",
};

describe("runResearch", () => {
  it("combines rules, pages and AI", async () => {
    const fetchPage = vi.fn(async (url: string) => ({ url, html: LINKTREE }));
    const ai = vi.fn<(input: AiResearchInput) => Promise<AiResearch>>(async () => aiNote);
    const r = await runResearch(person, { fetchPage, ai, now: 5 });

    expect(fetchPage).toHaveBeenCalledWith("https://linktr.ee/riya"); // social links are skipped
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(ai.mock.calls[0][0]).toMatchObject({ ruleNiche: "travel", hashtags: ["travel", "mountains"], pages: [{ title: "Riya | Linktree" }] });
    expect(r).toMatchObject({
      niche: "travel", nicheSource: "rules", // rules were clear, so AI's niche is not used
      themes: ["Treks", "Cafés"], summary: "Posts treks.", brands: ["Wildcraft"], pitch: "Price your travel collabs.",
      emails: ["riya@mail.com", "work@riya.in"], sources: ["https://linktr.ee/riya"], usedAi: true, researchedAt: 5,
    });
    expect(r.rate?.deliverable).toBe("reel");
  });

  it("uses the AI niche when rules are unsure", async () => {
    const vague = { ...person, bio: "hello", recentPosts: [], links: [] };
    const r = await runResearch(vague, { fetchPage: async () => null, ai: async () => aiNote });
    expect(r).toMatchObject({ niche: "lifestyle", nicheSource: "ai" });
  });

  it("still gives a note when pages and AI fail", async () => {
    const r = await runResearch(person, { fetchPage: async () => null, ai: async () => null, now: 9 });
    expect(r).toMatchObject({
      niche: "travel", nicheSource: "rules", themes: ["#travel", "#mountains"], summary: null, pitch: null,
      emails: ["riya@mail.com"], sources: [], usedAi: false,
    });
    expect(r.rate).not.toBeNull();
  });
});
