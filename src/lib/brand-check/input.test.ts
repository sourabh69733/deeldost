import { describe, expect, it } from "vitest";
import { BrandCheckInput } from "./input";

const shot = { mediaType: "image/jpeg", data: "a".repeat(200) } as const;

describe("BrandCheckInput", () => {
  it("accepts a pasted message with a brand name", () => {
    expect(BrandCheckInput.safeParse({ brandName: "Nykaa", message: "We would love to collab on a paid reel." }).success).toBe(true);
  });

  it("needs a brand name and message when there is no screenshot", () => {
    const r = BrandCheckInput.safeParse({ message: "short" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(["brandName", "message"]);
  });

  it("accepts a screenshot alone", () => {
    expect(BrandCheckInput.safeParse({ screenshot: shot }).success).toBe(true);
  });

  it("rejects unsupported image types", () => {
    expect(BrandCheckInput.safeParse({ screenshot: { ...shot, mediaType: "image/gif" } }).success).toBe(false);
  });
});
