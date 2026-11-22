import { describe, expect, it } from "vitest";
import { parseProfileUrl, unwrapLink } from "./url";

describe("parseProfileUrl", () => {
  it("reads Instagram profiles in any form", () => {
    const want = { platform: "instagram", handle: "virat.kohli", url: "https://www.instagram.com/virat.kohli/" };
    expect(parseProfileUrl("https://www.instagram.com/virat.kohli/")).toEqual(want);
    expect(parseProfileUrl("instagram.com/Virat.Kohli?igsh=abc")).toEqual(want);
    expect(parseProfileUrl("https://m.instagram.com/virat.kohli/reels/")).toEqual(want);
  });

  it("rejects Instagram pages that are not profiles", () => {
    expect(parseProfileUrl("https://www.instagram.com/p/ABC123/")).toBeNull();
    expect(parseProfileUrl("https://www.instagram.com/explore/")).toBeNull();
    expect(parseProfileUrl("https://www.instagram.com/")).toBeNull();
  });

  it("reads YouTube, X and LinkedIn", () => {
    expect(parseProfileUrl("https://www.youtube.com/@BeerBiceps/videos")).toEqual({ platform: "youtube", handle: "beerbiceps", url: "https://www.youtube.com/@beerbiceps" });
    expect(parseProfileUrl("https://youtube.com/channel/UC123abc")).toEqual({ platform: "youtube", handle: null, url: "https://www.youtube.com/channel/UC123abc" });
    expect(parseProfileUrl("https://twitter.com/NASA")).toEqual({ platform: "x", handle: "nasa", url: "https://x.com/nasa" });
    expect(parseProfileUrl("https://x.com/home")).toBeNull();
    expect(parseProfileUrl("https://in.linkedin.com/in/some-one-123/")?.handle).toBe("some-one-123");
    expect(parseProfileUrl("https://www.linkedin.com/in/some-one-123/")).toEqual({ platform: "linkedin", handle: "some-one-123", url: "https://www.linkedin.com/in/some-one-123/" });
    expect(parseProfileUrl("https://www.linkedin.com/feed/")).toBeNull();
  });

  it("keeps other sites as websites without query or hash", () => {
    expect(parseProfileUrl("https://linktr.ee/somecreator/?utm=x#top")).toEqual({ platform: "website", handle: null, url: "https://linktr.ee/somecreator" });
    expect(parseProfileUrl("Example.com")).toEqual({ platform: "website", handle: null, url: "https://example.com" });
  });

  it("rejects junk", () => {
    expect(parseProfileUrl("")).toBeNull();
    expect(parseProfileUrl("not a link")).toBeNull();
    expect(parseProfileUrl("javascript:alert(1)")).toBeNull();
    expect(parseProfileUrl("ftp://example.com")).toBeNull();
  });
});

describe("unwrapLink", () => {
  it("unwraps Instagram and YouTube redirect links", () => {
    expect(unwrapLink("https://l.instagram.com/?u=https%3A%2F%2Flinktr.ee%2Fme&e=AT0")).toBe("https://linktr.ee/me");
    expect(unwrapLink("https://www.youtube.com/redirect?q=https%3A%2F%2Fshop.in&v=1")).toBe("https://shop.in");
    expect(unwrapLink("https://shop.in/a")).toBe("https://shop.in/a");
  });
});
