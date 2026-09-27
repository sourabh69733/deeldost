import { describe, expect, it } from "vitest";
import { computeStats, median, topShares } from "./stats";

describe("median", () => {
  it("handles odd, even and empty lists", () => {
    expect(median([5, 1, 9])).toBe(5);
    expect(median([1, 2, 3, 10])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});

describe("topShares", () => {
  it("returns the largest groups as shares of the total", () => {
    expect(topShares([["Pune", 10], ["Mumbai", 30], ["Delhi", 60]], 2)).toEqual([["Delhi", 0.6], ["Mumbai", 0.3]]);
    expect(topShares([])).toEqual([]);
  });
});

describe("computeStats", () => {
  const reels = [
    { views: 10_000, likes: 400, comments: 20 },
    { views: 12_000, likes: 500, comments: 30 },
    { views: 900_000, likes: 50_000, comments: 900 }, // one viral reel
    { views: 0, likes: 0, comments: 0 }, // insights missing
  ];

  it("uses the median so a viral reel doesn't inflate views", () => {
    const s = computeStats(50_000, reels, null, 1);
    expect(s.avgViews).toBe(12_000);
    expect(s.reelsCounted).toBe(3);
    expect(s.engagementRate).toBeCloseTo(0.0442, 3);
    expect(s.audience).toBeNull();
    expect(s.refreshedAt).toBe(1);
  });

  it("copes with no reels", () => {
    const s = computeStats(800, [], null);
    expect(s.avgViews).toBeNull();
    expect(s.engagementRate).toBeNull();
  });

  it("summarises audience demographics", () => {
    const s = computeStats(50_000, reels, {
      city: [["Mumbai, Maharashtra", 300], ["Delhi", 700]],
      country: [["IN", 900], ["AE", 100]],
      age: [["18-24", 600], ["25-34", 400]],
      gender: [["F", 700], ["M", 300]],
    });
    expect(s.audience?.cities[0]).toEqual(["Delhi", 0.7]);
    expect(s.audience?.gender).toEqual([["F", 0.7], ["M", 0.3]]);
  });
});
