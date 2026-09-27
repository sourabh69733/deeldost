import { describe, expect, it } from "vitest";
import { KitSettings, kitPath } from "./settings";

describe("KitSettings", () => {
  it("accepts valid settings and rejects extras", () => {
    expect(KitSettings.safeParse({ public: true, niche: "beauty" }).success).toBe(true);
    expect(KitSettings.safeParse({ public: true, niche: "crypto" }).success).toBe(false);
    expect(KitSettings.safeParse({ public: true, niche: "beauty", email: "x" }).success).toBe(false);
  });
});

describe("kitPath", () => {
  it("builds a lowercase, safe path", () => {
    expect(kitPath("Glow.With.Riya")).toBe("/kit/glow.with.riya");
  });
});
