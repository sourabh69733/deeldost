import { describe, expect, it } from "vitest";
import { isSameOrigin } from "./same-origin";

const req = (headers: Record<string, string>) => new Request("http://x/api/session", { method: "POST", headers });

describe("isSameOrigin", () => {
  it("accepts our own pages", () => {
    expect(isSameOrigin(req({ origin: "https://dealdost.in", host: "dealdost.in" }))).toBe(true);
    expect(isSameOrigin(req({ origin: "https://dealdost.in", host: "internal:8080", "x-forwarded-host": "dealdost.in" }))).toBe(true);
  });

  it("rejects other sites and missing origin", () => {
    expect(isSameOrigin(req({ origin: "https://evil.example", host: "dealdost.in" }))).toBe(false);
    expect(isSameOrigin(req({ host: "dealdost.in" }))).toBe(false);
  });
});
