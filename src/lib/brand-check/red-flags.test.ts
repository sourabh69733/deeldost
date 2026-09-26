import { describe, expect, it } from "vitest";
import { runRedFlags, scoreRisk } from "./red-flags";

const ids = (msg: string, website = "https://brand.com") => runRedFlags(msg, "Nykaa", website).map((f) => f.id);

describe("runRedFlags", () => {
  it("flags requests to pay a fee", () => {
    expect(ids("Please pay the registration fee of Rs 999 to confirm your slot.")).toContain("pay_to_join");
  });

  it("flags buy-first-refund-later offers", () => {
    expect(ids("Buy the product first from our site and we will refund after the post.")).toContain("buy_first");
  });

  it("flags requests for OTP or ID documents", () => {
    expect(ids("Share your Aadhaar and the OTP you receive to verify.")).toContain("sensitive_info");
  });

  it("flags free email while claiming a big brand", () => {
    expect(ids("Hi, I am from Nykaa marketing. Mail me at nykaa.collabs@gmail.com")).toContain("free_email");
  });

  it("flags urgency and chat groups", () => {
    const found = ids("Reply within 1 hour and join our Telegram group t.me/deals");
    expect(found).toEqual(expect.arrayContaining(["urgency", "chat_groups"]));
  });

  it("flags a missing website", () => {
    expect(runRedFlags("We would love to work with you on a paid reel.", "Nykaa").map((f) => f.id)).toContain("no_website");
  });

  it("stays quiet on a normal, clean offer", () => {
    expect(ids("We would love a paid reel for our new serum. Budget is ₹15,000, paid 50% upfront. Contract attached.")).toEqual([]);
  });
});

describe("scoreRisk", () => {
  it("is high if any high-severity flag exists", () => {
    expect(scoreRisk([{ id: "x", severity: "high", reason: "" }])).toBe("high");
  });
  it("is medium for medium flags or domain notes", () => {
    expect(scoreRisk([{ id: "x", severity: "medium", reason: "" }])).toBe("medium");
    expect(scoreRisk([], 1)).toBe("medium");
  });
  it("is low with no signals", () => {
    expect(scoreRisk([])).toBe("low");
  });
});
