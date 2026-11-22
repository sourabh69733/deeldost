import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/instagram/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/instagram/api")>()),
  getProfile: vi.fn(),
  getMediaSince: vi.fn(),
  getMediaInsights: vi.fn(),
}));
vi.mock("@/lib/instagram/store", () => ({ getAccessToken: vi.fn(), markNeedsReconnect: vi.fn() }));
vi.mock("./store", () => ({ saveWrapped: vi.fn() }));

const api = await import("@/lib/instagram/api");
const igStore = await import("@/lib/instagram/store");
const store = await import("./store");
const { syncWrapped } = await import("./sync");

const NOW = Date.UTC(2026, 10, 21);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(igStore.getAccessToken).mockResolvedValue("token");
  vi.mocked(api.getProfile).mockResolvedValue({ user_id: "42", username: "riya", followers_count: 30_000, media_count: 90 });
  vi.mocked(api.getMediaSince).mockResolvedValue([
    { id: "r1", media_product_type: "REELS", timestamp: "2026-07-01T10:00:00+0000", like_count: 400, comments_count: 20, permalink: "https://instagram.com/reel/r1" },
    { id: "r2", media_product_type: "REELS", timestamp: "2026-03-01T10:00:00+0000", like_count: 100, comments_count: 5 },
    { id: "p1", media_product_type: "FEED", timestamp: "2026-02-01T10:00:00+0000", like_count: 90, comments_count: 3 },
  ]);
  vi.mocked(api.getMediaInsights).mockImplementation(async (_t, id) =>
    id === "r2" ? Promise.reject(new Error("missing")) : { views: 25_000, reach: 0 });
});

describe("syncWrapped", () => {
  it("asks views only for reels, survives a failed one and saves the snapshot", async () => {
    const w = await syncWrapped("u1", NOW);
    expect(api.getMediaSince).toHaveBeenCalledWith("token", expect.any(Number), expect.any(Number));
    expect(api.getMediaInsights).toHaveBeenCalledTimes(2);
    expect(w).toMatchObject({ year: 2026, username: "riya", posts: 3, reels: 2, views: 25_000, reelsWithViews: 1 });
    expect(w.topReel?.permalink).toBe("https://instagram.com/reel/r1");
    expect(store.saveWrapped).toHaveBeenCalledWith("u1", w);
  });

  it("flags the account for reconnect when the token is dead", async () => {
    vi.mocked(api.getProfile).mockRejectedValue(new api.InstagramApiError("expired", 190));
    await expect(syncWrapped("u1", NOW)).rejects.toThrow("expired");
    expect(igStore.markNeedsReconnect).toHaveBeenCalledWith("u1");
  });
});
