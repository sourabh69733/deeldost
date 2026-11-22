import { describe, expect, it } from "vitest";
import { computeWrapped, longestStreak, venueLine, wrappedYear, yearStartMs, type WrappedMedia } from "./compute";

// India time helper: a post at this IST date and hour.
const at = (y: number, m: number, d: number, h = 12) => Date.UTC(y, m - 1, d, h) - 5.5 * 3600_000;
const reel = (ts: number, views: number | null, likes = 100, comments = 5): WrappedMedia =>
  ({ type: "REELS", timestamp: ts, views, likes, comments, permalink: `https://instagram.com/reel/${ts}` });
const post = (ts: number, likes = 50, comments = 2): WrappedMedia =>
  ({ type: "FEED", timestamp: ts, views: null, likes, comments, permalink: null });

const base = { year: 2026, username: "riya", followers: 20_000, now: 1 };

describe("wrappedYear", () => {
  it("wraps the current year, or last year in January (India time)", () => {
    expect(wrappedYear(Date.UTC(2026, 10, 21))).toBe(2026);
    expect(wrappedYear(Date.UTC(2027, 0, 20))).toBe(2026);
    expect(wrappedYear(Date.UTC(2027, 0, 31, 19))).toBe(2027); // 1 Feb, 00:30 IST
  });
});

describe("computeWrapped", () => {
  it("counts only this year's posts, using India time at the year edge", () => {
    const w = computeWrapped({ ...base, media: [
      post(yearStartMs(2026) - 1), // 31 Dec 2025, 23:59 IST
      post(yearStartMs(2026)),
      reel(at(2026, 3, 4), 1000),
      post(yearStartMs(2027)),
    ] });
    expect(w.posts).toBe(2);
    expect(w.reels).toBe(1);
  });

  it("totals views, likes and comments and finds the top reel and best month", () => {
    const w = computeWrapped({ ...base, media: [
      reel(at(2026, 2, 1), 5_000, 300, 10),
      reel(at(2026, 7, 9), 80_000, 4_000, 200),
      reel(at(2026, 7, 10), null, 50, 1),
      post(at(2026, 3, 3), 100, 4),
    ] });
    expect(w.views).toBe(85_000);
    expect(w.reelsWithViews).toBe(2);
    expect(w.likes).toBe(4_450);
    expect(w.comments).toBe(215);
    expect(w.topReel).toMatchObject({ views: 80_000, month: 6 });
    expect(w.bestMonth).toBe(6);
    expect(w.months).toHaveLength(12);
    expect(w.months[6]).toEqual({ month: 6, posts: 2, views: 80_000 });
  });

  it("falls back to posts for best month when there are no views", () => {
    const w = computeWrapped({ ...base, media: [post(at(2026, 5, 1)), post(at(2026, 5, 2)), post(at(2026, 9, 1))] });
    expect(w.views).toBeNull();
    expect(w.topReel).toBeNull();
    expect(w.bestMonth).toBe(4);
  });

  it("finds the busiest weekday in India time", () => {
    // 1 Mar 2026 is a Sunday. 23:00 IST on Saturday is still Saturday in India.
    const w = computeWrapped({ ...base, media: [post(at(2026, 3, 1)), post(at(2026, 3, 8)), post(at(2026, 3, 7, 23))] });
    expect(w.busiestDay).toBe(0);
  });

  it("handles a year with no posts", () => {
    const w = computeWrapped({ ...base, media: [] });
    expect(w).toMatchObject({ posts: 0, views: null, bestMonth: null, busiestDay: null, streakWeeks: 0, persona: "rising" });
  });
});

describe("persona", () => {
  const steadyReels = (n: number, views = 1_000) => Array.from({ length: n }, (_, i) => reel(at(2026, 1, 5 + i * 7), views, 20, 0));

  it("is viral when one reel beats the typical reel 5x", () => {
    const w = computeWrapped({ ...base, media: [...steadyReels(3, 2_000), reel(at(2026, 6, 1), 50_000, 20, 0)] });
    expect(w.persona).toBe("viral");
  });
  it("is a conversation starter when comments are high for the likes", () => {
    const w = computeWrapped({ ...base, media: [reel(at(2026, 6, 1), 1_000, 500, 60)] });
    expect(w.persona).toBe("talker");
  });
  it("is consistent with an 8+ week streak", () => {
    expect(computeWrapped({ ...base, media: steadyReels(8) }).persona).toBe("steady");
  });
  it("is loved when typical engagement is high", () => {
    expect(computeWrapped({ ...base, media: [reel(at(2026, 6, 1), 1_000, 80, 2)] }).persona).toBe("loved");
  });
});

describe("longestStreak", () => {
  it("counts Monday-based weeks in a row", () => {
    // Mon 2 Mar, Sun 8 Mar (same week), Mon 9 Mar, then a gap, then Mon 30 Mar.
    expect(longestStreak([at(2026, 3, 2), at(2026, 3, 8), at(2026, 3, 9), at(2026, 3, 30)])).toBe(2);
    expect(longestStreak([])).toBe(0);
  });
});

describe("venueLine", () => {
  it("picks the biggest venue the views can fill", () => {
    expect(venueLine(400_000)).toBe("Enough to fill Narendra Modi Stadium 3 times");
    expect(venueLine(70_000)).toBe("Enough to fill Eden Gardens once");
    expect(venueLine(1_000)).toBe("Enough to fill a cinema hall 4 times");
    expect(venueLine(100)).toBeNull();
  });
});
