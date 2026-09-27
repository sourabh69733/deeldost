import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./crypto";

const k1 = randomBytes(32).toString("base64");
const k2 = randomBytes(32).toString("base64");

describe("token encryption", () => {
  it("round-trips and never contains the plain text", () => {
    const sealed = encrypt("IGAAtoken123", k1);
    expect(sealed).not.toContain("IGAAtoken123");
    expect(decrypt(sealed, k1)).toBe("IGAAtoken123");
  });

  it("uses a fresh IV each time", () => {
    expect(encrypt("same", k1)).not.toBe(encrypt("same", k1));
  });

  it("fails with the wrong key or tampered data", () => {
    const sealed = encrypt("secret", k1);
    expect(() => decrypt(sealed, k2)).toThrow();
    const parts = sealed.split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decrypt(parts.join("."), k1)).toThrow();
  });

  it("rejects a bad key", () => {
    expect(() => encrypt("x", "c2hvcnQ=")).toThrow(/32 bytes/);
  });
});
