import { describe, expect, it } from "vitest";
import { findCount, parseCount } from "./count";

describe("parseCount", () => {
  it("reads plain and short counts", () => {
    expect(parseCount("1,234")).toBe(1234);
    expect(parseCount("1,23,456")).toBe(123456);
    expect(parseCount("45.6K")).toBe(45600);
    expect(parseCount("1.2M")).toBe(1200000);
    expect(parseCount("12.5 lakh")).toBe(1250000);
    expect(parseCount("2L")).toBe(200000);
    expect(parseCount("1 Cr")).toBe(10000000);
    expect(parseCount("500+")).toBe(500);
  });

  it("returns null for anything else", () => {
    expect(parseCount("")).toBeNull();
    expect(parseCount(null)).toBeNull();
    expect(parseCount("many")).toBeNull();
    expect(parseCount("12 apples")).toBeNull();
  });
});

describe("findCount", () => {
  const header = "virat.kohli\nFollow\nMessage\n1,234 posts\n271M followers\n310 following";
  it("finds the count before a word", () => {
    expect(findCount(header, ["followers"])).toBe(271000000);
    expect(findCount(header, ["following"])).toBe(310);
    expect(findCount(header, ["posts"])).toBe(1234);
    expect(findCount("@beerbiceps • 8.9M subscribers • 2.1K videos", ["subscribers"])).toBe(8900000);
    expect(findCount("123K Followers, 456 Following, 789 Posts - See Instagram", ["following"])).toBe(456);
  });

  it("does not mix up followers and following", () => {
    expect(findCount("310 following", ["followers"])).toBeNull();
  });
});
