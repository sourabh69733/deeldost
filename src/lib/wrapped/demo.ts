// A made-up Wrapped so visitors can try the story before connecting. Always labelled "Sample" in the UI.
import type { Wrapped } from "./compute";

const monthly = [[6, 42_000], [8, 61_000], [7, 55_000], [9, 88_000], [11, 140_000], [8, 96_000], [10, 410_000], [9, 120_000], [12, 150_000], [11, 132_000], [9, 98_000], [0, 0]];

export const DEMO_WRAPPED: Wrapped = {
  year: 2026,
  username: "your.handle",
  followers: 24_600,
  posts: 100,
  reels: 82,
  views: 1_392_000,
  reelsWithViews: 60,
  likes: 96_400,
  comments: 7_300,
  topReel: { views: 318_000, likes: 21_500, comments: 940, month: 6, permalink: null },
  months: monthly.map(([posts, views], month) => ({ month, posts, views })),
  bestMonth: 6,
  busiestDay: 0,
  streakWeeks: 14,
  persona: "viral",
  generatedAt: Date.UTC(2026, 10, 20),
};
