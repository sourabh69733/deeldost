import { describe, expect, it } from "vitest";
import { DealReportInput } from "./deal-report";

const valid = { deliverable: "reel", followers: 50_000, avgViews: 15_000, niche: "fashion", addOns: ["usageRights"], paid: 12_000 };

describe("DealReportInput", () => {
  it("accepts a normal report", () => {
    expect(DealReportInput.safeParse(valid).success).toBe(true);
  });

  it("rejects silly amounts", () => {
    expect(DealReportInput.safeParse({ ...valid, paid: 5 }).success).toBe(false);
    expect(DealReportInput.safeParse({ ...valid, paid: 50_000_000 }).success).toBe(false);
  });

  it("refuses extra fields so nothing identifying slips in", () => {
    expect(DealReportInput.safeParse({ ...valid, handle: "someone" }).success).toBe(false);
  });
});
