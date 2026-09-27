import { describe, expect, it } from "vitest";
import { clientIp, windowKey } from "./rate-limit";

describe("windowKey", () => {
  const t = Date.UTC(2026, 8, 27, 10, 15);

  it("is the same within an hour and changes the next hour", () => {
    expect(windowKey("check", "1.2.3.4", t)).toBe(windowKey("check", "1.2.3.4", t + 30 * 60_000));
    expect(windowKey("check", "1.2.3.4", t)).not.toBe(windowKey("check", "1.2.3.4", t + 60 * 60_000));
  });

  it("never contains the raw IP", () => {
    expect(windowKey("check", "1.2.3.4", t)).not.toContain("1.2.3.4");
  });

  it("separates visitors and actions", () => {
    expect(windowKey("check", "1.2.3.4", t)).not.toBe(windowKey("check", "5.6.7.8", t));
    expect(windowKey("check", "1.2.3.4", t)).not.toBe(windowKey("other", "1.2.3.4", t));
  });
});

describe("clientIp", () => {
  const req = new Request("http://x", { headers: { "x-forwarded-for": "6.6.6.6, 9.9.9.9, 10.0.0.1" } });

  it("ignores client-supplied entries on the left", () => {
    expect(clientIp(req, 0)).toBe("10.0.0.1");
    expect(clientIp(req, 1)).toBe("9.9.9.9");
  });

  it("falls back when the header is missing", () => {
    expect(clientIp(new Request("http://x"), 0)).toBe("unknown");
  });
});
