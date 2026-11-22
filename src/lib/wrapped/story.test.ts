import { describe, expect, it } from "vitest";
import { computeWrapped } from "./compute";
import { DEMO_WRAPPED } from "./demo";
import { buildSlides } from "./story";

describe("buildSlides", () => {
  it("shows every slide for a full year", () => {
    expect(buildSlides(DEMO_WRAPPED).map((s) => s.kind)).toEqual(
      ["cover", "posts", "views", "top", "months", "streak", "love", "persona", "summary"]);
  });

  it("skips view slides when there are no views", () => {
    const w = computeWrapped({ year: 2026, username: "a", followers: 10, media: [
      { type: "FEED", timestamp: Date.UTC(2026, 4, 1), views: null, likes: 5, comments: 0, permalink: null },
    ] });
    const kinds = buildSlides(w).map((s) => s.kind);
    expect(kinds).not.toContain("views");
    expect(kinds).not.toContain("top");
    expect(kinds).toContain("months");
  });

  it("says when views come from a sample of reels", () => {
    const views = buildSlides({ ...DEMO_WRAPPED, reels: 82, reelsWithViews: 60 }).find((s) => s.kind === "views");
    expect(views).toMatchObject({ note: "Views from your latest 60 reels." });
  });

  it("shows an empty state with no posts", () => {
    expect(buildSlides({ ...DEMO_WRAPPED, posts: 0 }).map((s) => s.kind)).toEqual(["cover", "empty"]);
  });

  it("demo data adds up", () => {
    expect(DEMO_WRAPPED.months.reduce((s, m) => s + m.posts, 0)).toBe(DEMO_WRAPPED.posts);
    expect(DEMO_WRAPPED.months.reduce((s, m) => s + m.views, 0)).toBe(DEMO_WRAPPED.views);
  });
});
