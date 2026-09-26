import { describe, expect, it } from "vitest";
import { extractDomain } from "./domain-check";

describe("extractDomain", () => {
  it("normalises normal websites", () => {
    expect(extractDomain("https://www.nykaa.com/about")).toBe("nykaa.com");
    expect(extractDomain("brand.in")).toBe("brand.in");
  });

  it("refuses internal hosts and raw IPs", () => {
    for (const bad of ["localhost", "169.254.169.254", "metadata.google.internal", "http://[::1]", "intranet"]) {
      expect(extractDomain(bad)).toBeNull();
    }
  });
});
