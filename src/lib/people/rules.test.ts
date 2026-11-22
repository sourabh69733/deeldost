import { describe, expect, it } from "vitest";
import { estimateRate, findEmails, guessNiche, hashtags, researchLinks } from "./rules";

describe("guessNiche", () => {
  it("picks the niche with most keyword hits", () => {
    expect(guessNiche("Travel . lifestyle\n#travelgram #mountains #trekking #fyp")).toEqual({ niche: "travel", hits: 4, confident: true });
    expect(guessNiche("Skincare and makeup tips #skincareroutine")).toMatchObject({ niche: "beauty" });
    expect(guessNiche("Daily misal pav and street food in Pune #foodie")).toMatchObject({ niche: "food" });
  });

  it("matches only at the start of words", () => {
    expect(guessNiche("#instadaily #trending")).toEqual({ niche: "other", hits: 0, confident: false });
  });

  it("is not confident on a close call or a single hit", () => {
    expect(guessNiche("travel lifestyle travel lifestyle").confident).toBe(false);
    expect(guessNiche("travel").confident).toBe(false);
  });
});

describe("hashtags", () => {
  it("collects unique lowercase tags, including Hindi, without reach-only tags", () => {
    expect(hashtags(["Fun day #FYP #travel #viralreels", "#travel #दिवाली #ContentCreator #viralreeĺs", null])).toEqual(["travel", "दिवाली"]);
  });
});

describe("findEmails", () => {
  it("finds public emails and skips image names and placeholders", () => {
    expect(findEmails(["Collabs: Riya@Mail.com", "logo@2x.png you@example.com", "riya@mail.com"])).toEqual(["riya@mail.com"]);
  });
});

describe("estimateRate", () => {
  it("prices one reel from followers with assumed views", () => {
    const r = estimateRate({ platform: "instagram", followers: 50_000 }, "travel");
    expect(r).toMatchObject({ deliverable: "reel", assumedViews: 10_000 });
    expect(r!.low).toBeLessThan(r!.fair);
    expect(r!.fair).toBeLessThan(r!.high);
  });

  it("uses a YouTube integration for YouTube and skips other platforms or tiny counts", () => {
    expect(estimateRate({ platform: "youtube", followers: 10_000 }, "tech")?.deliverable).toBe("yt_integration");
    expect(estimateRate({ platform: "x", followers: 10_000 }, "tech")).toBeNull();
    expect(estimateRate({ platform: "instagram", followers: null }, "tech")).toBeNull();
    expect(estimateRate({ platform: "instagram", followers: 124 }, "tech")).toBeNull();
  });
});

describe("researchLinks", () => {
  it("keeps their own sites and link pages, not social profiles", () => {
    expect(researchLinks({ platform: "instagram", url: "https://www.instagram.com/riya/", links: ["https://youtube.com/@riya", "https://linktr.ee/riya", "https://riya.in/", "https://shop.riya.in/"] }))
      .toEqual(["https://linktr.ee/riya", "https://riya.in/"]);
    expect(researchLinks({ platform: "website", url: "https://riya.in", links: ["https://instagram.com/riya"] })).toEqual(["https://riya.in"]);
  });
});
