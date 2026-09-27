import { describe, expect, it } from "vitest";
import { buildRateCard, parseRateCardQuery, rateCardQuery } from "./rate-card";

const params = { platform: "instagram", followers: 50_000, avgViews: 15_000, niche: "fashion", handle: "glow.with.riya" } as const;

describe("rate card query", () => {
  it("round-trips through a short query string", () => {
    const q = rateCardQuery(params);
    expect(q).toBe("p=instagram&f=50000&v=15000&n=fashion&h=glow.with.riya");
    expect(parseRateCardQuery(new URLSearchParams(q))).toEqual(params);
  });

  it("rejects bad input", () => {
    expect(parseRateCardQuery(new URLSearchParams("p=instagram&f=0&v=10&n=fashion"))).toBeNull();
    expect(parseRateCardQuery(new URLSearchParams("p=tiktok&f=10&v=10&n=fashion"))).toBeNull();
    expect(parseRateCardQuery(new URLSearchParams("p=instagram&f=10&v=10&n=fashion&h=<script>"))).toBeNull();
  });

  it("allows a card without a handle", () => {
    const noHandle = { ...params, handle: undefined };
    expect(parseRateCardQuery(new URLSearchParams(rateCardQuery(noHandle)))?.handle).toBeUndefined();
  });
});

describe("buildRateCard", () => {
  it("lists only the platform's deliverables, reel priced like the calculator", () => {
    const card = buildRateCard(params);
    expect(card.rows.map((r) => r.deliverable)).toEqual(["reel", "static", "stories"]);
    expect(card.rows[0].price).toBe(9000);
  });

  it("shows add-ons as percentages", () => {
    expect(buildRateCard(params).addOns.find((a) => a.id === "usageRights")?.percent).toBe(40);
  });
});
