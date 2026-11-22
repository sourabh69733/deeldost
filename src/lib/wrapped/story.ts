// Which story slides to show for a Wrapped, and their words. Pure; the UI only draws them.
import { compact } from "@/lib/format";
import { DAYS, MONTHS, MONTHS_LONG, PERSONAS } from "./config";
import { venueLine, type Wrapped } from "./compute";

export type Slide =
  | { kind: "cover" }
  | { kind: "posts"; posts: number; reels: number; day: string | null }
  | { kind: "views"; views: number; venue: string | null; note: string }
  | { kind: "top"; views: number; likes: number; comments: number; month: string; permalink: string | null }
  | { kind: "months"; bars: { label: string; value: number; best: boolean }[]; best: string; byViews: boolean }
  | { kind: "streak"; weeks: number; line: string }
  | { kind: "love"; likes: number; comments: number; line: string }
  | { kind: "persona"; emoji: string; title: string; line: string }
  | { kind: "summary" }
  | { kind: "empty" };

function streakLine(weeks: number): string {
  if (weeks >= 20) return "That's not a streak, that's a lifestyle.";
  if (weeks >= 8) return "Consistency unlocked. The algorithm noticed.";
  if (weeks >= 3) return "A solid run. Next year, go longer.";
  return "Every streak starts with one post.";
}

function loveLine(likes: number, comments: number): string {
  if (comments > 0 && likes / comments < 15) return "That's a lot of people with something to say to you.";
  return `That's about ${compact(Math.round(likes / 365))} likes a day, every day.`;
}

export function buildSlides(w: Wrapped): Slide[] {
  if (!w.posts) return [{ kind: "cover" }, { kind: "empty" }];
  const slides: Slide[] = [{ kind: "cover" }];

  slides.push({ kind: "posts", posts: w.posts, reels: w.reels, day: w.busiestDay === null ? null : DAYS[w.busiestDay] });

  if (w.views !== null) {
    const note = w.reelsWithViews < w.reels
      ? `Views from your latest ${w.reelsWithViews} reels.`
      : `Views across your ${w.reelsWithViews} reels this year.`;
    slides.push({ kind: "views", views: w.views, venue: venueLine(w.views), note });
  }

  if (w.topReel) {
    slides.push({ kind: "top", ...w.topReel, month: MONTHS_LONG[w.topReel.month] });
  }

  if (w.bestMonth !== null) {
    const byViews = w.views !== null;
    slides.push({
      kind: "months",
      byViews,
      best: MONTHS_LONG[w.bestMonth],
      bars: w.months.map((m) => ({ label: MONTHS[m.month], value: byViews ? m.views : m.posts, best: m.month === w.bestMonth })),
    });
  }

  if (w.streakWeeks >= 2) slides.push({ kind: "streak", weeks: w.streakWeeks, line: streakLine(w.streakWeeks) });
  if (w.likes > 0) slides.push({ kind: "love", likes: w.likes, comments: w.comments, line: loveLine(w.likes, w.comments) });

  slides.push({ kind: "persona", ...PERSONAS[w.persona] });
  slides.push({ kind: "summary" });
  return slides;
}
