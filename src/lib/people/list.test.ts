import { describe, expect, it } from "vitest";
import { profileFromUrl, type ExtractedProfile } from "./extract";
import { countByStatus, displayHandle, filterPeople, isStatus } from "./list";
import { mergeProfile, type Person } from "./person";

const make = (url: string, extra: Partial<Person> = {}): Person =>
  ({ ...mergeProfile(null, profileFromUrl(url) as ExtractedProfile, { source: "link", now: 1 }), ...extra });

const riya = make("instagram.com/riya", { name: "Riya Sharma", status: "contacted" });
const tech = make("youtube.com/@techguru", { notes: "phone reviews" });
const site = make("https://riya.in/about");

describe("filterPeople", () => {
  it("filters by status and search text", () => {
    expect(filterPeople([riya, tech, site], { status: "contacted" })).toEqual([riya]);
    expect(filterPeople([riya, tech, site], { q: "@RIYA" })).toEqual([riya, site]);
    expect(filterPeople([riya, tech, site], { q: "phone" })).toEqual([tech]);
    expect(filterPeople([riya, tech, site], {})).toHaveLength(3);
  });
});

describe("countByStatus", () => {
  it("counts every status, including zeros", () => {
    const c = countByStatus([riya, tech, site]);
    expect(c.saved).toBe(2);
    expect(c.contacted).toBe(1);
    expect(c.signed_up).toBe(0);
  });
});

describe("helpers", () => {
  it("checks statuses and shows handles", () => {
    expect(isStatus("replied")).toBe(true);
    expect(isStatus("nope")).toBe(false);
    expect(isStatus(undefined)).toBe(false);
    expect(displayHandle(riya)).toBe("@riya");
    expect(displayHandle(site)).toBe("riya.in/about");
    expect(displayHandle(make("linkedin.com/in/riya-s"))).toBe("linkedin.com/in/riya-s");
  });
});
