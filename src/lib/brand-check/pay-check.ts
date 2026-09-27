// "Is this pay fair?" Compares the amount a brand offers with the creator's fair rate.
// Pure functions, safe on client and server.
import { calculateRate } from "@/lib/pricing/calculate";
import type { Deliverable, Niche } from "@/lib/pricing/config";

export type CreatorStats = { followers: number; avgViews: number; niche: Niche };

export type PayVerdict = "low" | "fair" | "high" | "too_good";

export type PayCheck = {
  offered: number;
  deliverable: Deliverable;
  low: number;
  fair: number;
  high: number;
  verdict: PayVerdict;
};

// Offers above this multiple of the creator's high rate look like bait.
export const TOO_GOOD_MULTIPLE = 3;

const UNITS: Record<string, number> = { k: 1e3, thousand: 1e3, l: 1e5, lac: 1e5, lakh: 1e5, lakhs: 1e5 };
const NUM = String.raw`(\d[\d,]*(?:\.\d+)?)`;
const UNIT = String.raw`\s*(k|thousand|lakhs?|lac|l)?\b`;
const PATTERNS = [
  // ₹15,000 · Rs. 15k · INR 1.5 lakh
  new RegExp(String.raw`(?:₹|\brs\.?|\binr)\s*${NUM}${UNIT}`, "gi"),
  // 15,000 rupees · 15000/-
  new RegExp(String.raw`\b${NUM}${UNIT}\s*(?:rupees|rs\b|inr\b|\/-)`, "gi"),
  // budget of 15k · we pay 20000
  new RegExp(String.raw`\b(?:budget|pay|paying|offer|offering|compensation|remuneration)\D{0,15}?${NUM}${UNIT}`, "gi"),
];

/** Largest rupee amount mentioned in the message, or null. */
export function extractOfferedAmount(message: string): number | null {
  let best: number | null = null;
  for (const re of PATTERNS) {
    for (const m of message.matchAll(re)) {
      const value = Number(m[1].replace(/,/g, "")) * (UNITS[m[2]?.toLowerCase() ?? ""] ?? 1);
      if (value >= 100 && (best === null || value > best)) best = value;
    }
  }
  return best;
}

/** What the brand is most likely asking for. Defaults to a reel. */
export function guessDeliverable(message: string): Deliverable {
  const m = message.toLowerCase();
  if (/\b(yt|youtube)\s*shorts?\b|\bshorts\b/.test(m)) return "yt_short";
  if (/\b(youtube|yt)\b|\bintegration\b|\bdedicated video\b/.test(m)) return "yt_integration";
  if (/\breels?\b/.test(m)) return "reel";
  if (/\bstor(y|ies)\b/.test(m)) return "stories";
  if (/\b(static|carousel|post)\b/.test(m)) return "static";
  return "reel";
}

export function assessPay(offered: number, deliverable: Deliverable, stats: CreatorStats): PayCheck {
  const rate = calculateRate({ ...stats, deliverable, addOns: [] });
  const verdict: PayVerdict =
    offered > rate.high * TOO_GOOD_MULTIPLE ? "too_good"
    : offered > rate.high ? "high"
    : offered >= rate.low ? "fair"
    : "low";
  return { offered, deliverable, low: rate.low, fair: rate.fair, high: rate.high, verdict };
}
