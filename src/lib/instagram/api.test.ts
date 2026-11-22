import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstagramApiError, authorizeUrl, exchangeCode, getFollowerDemographics, getMediaInsights, getMediaSince, parseIgTime } from "./api";

// Responses below follow the shapes in Meta's Instagram Login docs.
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  vi.stubEnv("INSTAGRAM_APP_ID", "123");
  vi.stubEnv("INSTAGRAM_APP_SECRET", "shh");
  vi.stubEnv("APP_URL", "https://dealdost.example/");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("authorizeUrl", () => {
  it("asks for profile + insights and passes state", () => {
    const u = new URL(authorizeUrl("state123"));
    expect(u.origin + u.pathname).toBe("https://www.instagram.com/oauth/authorize");
    expect(u.searchParams.get("redirect_uri")).toBe("https://dealdost.example/api/instagram/callback");
    expect(u.searchParams.get("scope")).toBe("instagram_business_basic,instagram_business_manage_insights");
    expect(u.searchParams.get("state")).toBe("state123");
  });

  it("refuses when the app isn't configured", () => {
    vi.stubEnv("INSTAGRAM_APP_SECRET", "not-set");
    expect(() => authorizeUrl("s")).toThrow(InstagramApiError);
  });
});

describe("exchangeCode", () => {
  it("swaps the code for a long-lived token", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ data: [{ access_token: "short", user_id: 42, permissions: "instagram_business_basic,instagram_business_manage_insights" }] }))
      .mockResolvedValueOnce(json({ access_token: "long", token_type: "bearer", expires_in: 5_183_944 }));
    vi.stubGlobal("fetch", fetchMock);

    const r = await exchangeCode("code1");
    expect(r.token).toBe("long");
    expect(r.igUserId).toBe("42");
    expect(r.permissions).toHaveLength(2);
    expect(r.expiresAt).toBeGreaterThan(Date.now() + 59 * 86_400_000);
    expect(String(fetchMock.mock.calls[1][0])).toContain("grant_type=ig_exchange_token");
  });

  it("surfaces Instagram errors, flagging expired tokens", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ error: { message: "Session expired", code: 190 } }, 400)));
    const err = await exchangeCode("x").catch((e) => e);
    expect(err).toBeInstanceOf(InstagramApiError);
    expect(err.needsReconnect).toBe(true);
  });
});

describe("insights parsing", () => {
  it("reads reel views and reach", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({
      data: [
        { name: "views", period: "lifetime", values: [{ value: 15300 }] },
        { name: "reach", period: "lifetime", values: [{ value: 11020 }] },
      ],
    })));
    expect(await getMediaInsights("t", "m1")).toEqual({ views: 15300, reach: 11020 });
  });

  it("reads follower demographics", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({
      data: [{
        name: "follower_demographics",
        total_value: { breakdowns: [{ dimension_keys: ["city"], results: [
          { dimension_values: ["Mumbai, Maharashtra"], value: 1200 },
          { dimension_values: ["Pune, Maharashtra"], value: 300 },
        ] }] },
      }],
    })));
    expect(await getFollowerDemographics("t", "city")).toEqual([["Mumbai, Maharashtra", 1200], ["Pune, Maharashtra", 300]]);
  });
});

describe("getMediaSince", () => {
  const item = (id: string, timestamp: string) => ({ id, media_product_type: "REELS", timestamp });

  it("pages until posts are older than the cutoff", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ data: [item("a", "2026-05-01T10:00:00+0000")], paging: { cursors: { after: "c1" }, next: "https://next" } }))
      .mockResolvedValueOnce(json({ data: [item("b", "2026-02-01T10:00:00+0000"), item("old", "2025-12-30T10:00:00+0000")], paging: { cursors: { after: "c2" }, next: "https://next" } }));
    vi.stubGlobal("fetch", fetchMock);
    const out = await getMediaSince("t", Date.UTC(2026, 0, 1), 400);
    expect(out.map((m) => m.id)).toEqual(["a", "b"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get("after")).toBe("c1");
  });

  it("stops at the cap and when there is no next page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ data: [item("a", "2026-05-01T10:00:00+0000"), item("b", "2026-05-01T09:00:00+0000")] })));
    expect((await getMediaSince("t", 0, 1)).map((m) => m.id)).toEqual(["a"]);
    expect((await getMediaSince("t", 0, 10)).map((m) => m.id)).toEqual(["a", "b"]);
  });
});

describe("parseIgTime", () => {
  it("reads Instagram's +0000 offsets", () => {
    expect(parseIgTime("2026-03-01T10:00:00+0000")).toBe(Date.UTC(2026, 2, 1, 10));
    expect(parseIgTime(undefined)).toBeNaN();
  });
});
