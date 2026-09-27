import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", async (orig) => ({
  ...(await orig<typeof import("./api")>()),
  getProfile: vi.fn(),
  getRecentMedia: vi.fn(),
  getMediaInsights: vi.fn(),
  getFollowerDemographics: vi.fn(),
}));
vi.mock("./store", () => ({
  getAccessToken: vi.fn(),
  markNeedsReconnect: vi.fn(),
  saveStats: vi.fn(),
}));

const api = await import("./api");
const store = await import("./store");
const { syncStats } = await import("./sync");

const profile = { user_id: "42", username: "riya", followers_count: 50_000, media_count: 80 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(store.getAccessToken).mockResolvedValue("token");
  vi.mocked(api.getProfile).mockResolvedValue(profile);
  vi.mocked(api.getRecentMedia).mockResolvedValue([
    { id: "r1", media_product_type: "REELS", like_count: 400, comments_count: 20 },
    { id: "p1", media_product_type: "FEED", like_count: 90, comments_count: 3 },
    { id: "r2", media_product_type: "REELS", like_count: 500, comments_count: 30 },
    { id: "r3", media_product_type: "REELS", like_count: 450, comments_count: 25 },
  ]);
  vi.mocked(api.getMediaInsights).mockImplementation(async (_t, id) =>
    id === "r3" ? Promise.reject(new Error("insight missing")) : { views: id === "r1" ? 10_000 : 12_000, reach: 0 });
  vi.mocked(api.getFollowerDemographics).mockImplementation(async (_t, d) =>
    d === "city" ? [["Mumbai", 700], ["Delhi", 300]] : Promise.reject(new Error("not available")));
});

describe("syncStats", () => {
  it("samples only reels, skips failed insights and saves the snapshot", async () => {
    const stats = await syncStats("u1");
    expect(api.getMediaInsights).toHaveBeenCalledTimes(3);
    expect(stats.reelsCounted).toBe(2);
    expect(stats.avgViews).toBe(11_000);
    expect(stats.audience?.cities[0]).toEqual({ label: "Mumbai", share: 0.7 });
    expect(store.saveStats).toHaveBeenCalledWith("u1", stats, profile);
  });

  it("skips demographics for small accounts", async () => {
    vi.mocked(api.getProfile).mockResolvedValue({ ...profile, followers_count: 80 });
    expect((await syncStats("u1")).audience).toBeNull();
    expect(api.getFollowerDemographics).not.toHaveBeenCalled();
  });

  it("flags the account for reconnect when the token is dead", async () => {
    vi.mocked(api.getProfile).mockRejectedValue(new api.InstagramApiError("expired", 190));
    await expect(syncStats("u1")).rejects.toThrow("expired");
    expect(store.markNeedsReconnect).toHaveBeenCalledWith("u1");
  });
});
