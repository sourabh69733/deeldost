import { describe, expect, it } from "vitest";
import { calculateRate } from "./calculate";
import { MIN_PRICE } from "./config";

const base = { deliverable: "reel", followers: 50_000, avgViews: 15_000, niche: "fashion", addOns: [] } as const;

describe("calculateRate", () => {
  it("prices a normal fashion reel from views x CPM", () => {
    // 15 x ₹600 CPM x reel 1.0 x engagement 1.0 (30% ratio) = ₹9,000
    const r = calculateRate({ ...base, addOns: [] });
    expect(r.fair).toBe(9000);
    expect(r.low).toBeLessThan(r.fair);
    expect(r.high).toBeGreaterThan(r.fair);
  });

  it("never goes below the minimum floor", () => {
    const r = calculateRate({ ...base, avgViews: 100, addOns: [] });
    expect(r.low).toBe(MIN_PRICE);
    expect(r.fair).toBe(MIN_PRICE);
  });

  it("charges more for add-ons like usage rights", () => {
    const plain = calculateRate({ ...base, addOns: [] });
    const withRights = calculateRate({ ...base, addOns: ["usageRights"] });
    expect(withRights.fair).toBeGreaterThan(plain.fair);
  });

  it("rewards strong reach and discounts weak reach", () => {
    const weak = calculateRate({ ...base, followers: 500_000, addOns: [] });
    const strong = calculateRate({ ...base, followers: 20_000, addOns: [] });
    expect(strong.fair).toBeGreaterThan(weak.fair);
  });

  it("rounds to clean numbers", () => {
    const r = calculateRate({ ...base, avgViews: 12_345, addOns: [] });
    expect(r.fair % 250).toBe(0);
  });
});
