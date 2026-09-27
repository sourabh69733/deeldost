import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstagramApiError, authorizeUrl, exchangeCode, getFollowerDemographics, getMediaInsights } from "./api";

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
