import { describe, expect, it, vi } from "vitest";

vi.mock("./session", () => ({ getCurrentUser: vi.fn() }));
const { isAdminEmail, parseAdminEmails } = await import("./admin");

describe("admin emails", () => {
  it("parses a comma list, ignoring case and blanks", () => {
    expect([...parseAdminEmails(" A@x.com, ,b@y.in ,nope")]).toEqual(["a@x.com", "b@y.in"]);
  });

  it("matches only listed emails", () => {
    const admins = parseAdminEmails("a@x.com");
    expect(isAdminEmail("A@X.com", admins)).toBe(true);
    expect(isAdminEmail("b@x.com", admins)).toBe(false);
    expect(isAdminEmail(null, admins)).toBe(false);
    expect(isAdminEmail("a@x.com", parseAdminEmails(""))).toBe(false);
  });
});
