import { describe, expect, it } from "vitest";
import { assessPay, extractOfferedAmount, guessDeliverable } from "./pay-check";

describe("extractOfferedAmount", () => {
  it.each([
    ["Budget is ₹15,000 for one reel", 15000],
    ["We can pay Rs. 12k", 12000],
    ["INR 1.5 lakh for the campaign", 150000],
    ["Payment: 8000/- after posting", 8000],
    ["We are offering 20,000 rupees", 20000],
    ["our budget of 25k", 25000],
  ])("reads %s", (msg, amount) => {
    expect(extractOfferedAmount(msg)).toBe(amount);
  });

  it("picks the largest amount", () => {
    expect(extractOfferedAmount("Pay Rs 999 registration and earn ₹50,000")).toBe(50000);
  });

  it("ignores follower counts and plain numbers", () => {
    expect(extractOfferedAmount("Loved your page with 15k followers, 3 reels needed")).toBeNull();
  });
});

describe("guessDeliverable", () => {
  it.each([
    ["one reel and 2 stories", "reel"],
    ["a dedicated YouTube integration", "yt_integration"],
    ["2 YouTube shorts", "yt_short"],
    ["3 stories with link", "stories"],
    ["a carousel post", "static"],
    ["promote our product", "reel"],
  ])("%s -> %s", (msg, d) => {
    expect(guessDeliverable(msg)).toBe(d);
  });
});

describe("assessPay", () => {
  // Fashion reel, 50K followers, 15K views: fair ₹9,000, range ₹6,750 to ₹12,000.
  const stats = { followers: 50_000, avgViews: 15_000, niche: "fashion" } as const;

  it.each([
    [3000, "low"],
    [9000, "fair"],
    [20000, "high"],
    [100000, "too_good"],
  ] as const)("₹%i is %s", (offered, verdict) => {
    expect(assessPay(offered, "reel", stats).verdict).toBe(verdict);
  });
});
