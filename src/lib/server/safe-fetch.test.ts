import { describe, expect, it } from "vitest";
import { fetchPublicPage, isPrivateIp } from "./safe-fetch";

describe("isPrivateIp", () => {
  it("blocks internal addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "not-an-ip"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
  });

  it("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "172.32.0.1", "104.18.0.1", "2606:4700::1111", "::ffff:8.8.8.8"]) {
      expect(isPrivateIp(ip), ip).toBe(false);
    }
  });
});

describe("fetchPublicPage", () => {
  it("refuses internal and non-web addresses without fetching", async () => {
    expect(await fetchPublicPage("http://localhost:3000/")).toBeNull();
    expect(await fetchPublicPage("http://169.254.169.254/latest/meta-data")).toBeNull();
    expect(await fetchPublicPage("http://metadata.google.internal/")).toBeNull();
    expect(await fetchPublicPage("file:///etc/passwd")).toBeNull();
    expect(await fetchPublicPage("not a url")).toBeNull();
  });
});
