import { describe, expect, it } from "vitest";
import { profileFromUrl, type ExtractedProfile } from "./extract";
import { addNotes, mergeProfile, personId } from "./person";

const base = profileFromUrl("instagram.com/riya") as ExtractedProfile;

describe("personId", () => {
  it("uses the handle when there is one", () => {
    expect(personId(base)).toBe("instagram_riya");
  });
  it("hashes the url otherwise", () => {
    const id = personId({ platform: "website", handle: null, url: "https://riya.in" });
    expect(id).toMatch(/^website_[0-9a-f]{16}$/);
    expect(id).toBe(personId({ platform: "website", handle: null, url: "https://riya.in" }));
  });
});

describe("mergeProfile", () => {
  it("creates a new saved person", () => {
    const p = mergeProfile(null, { ...base, followers: 100 }, { source: "link", now: 1, notes: "met at event" });
    expect(p).toMatchObject({ id: "instagram_riya", status: "saved", followers: 100, notes: "met at event", createdAt: 1, updatedAt: 1, capturedAt: null, source: "link" });
  });

  it("keeps old values when a new capture is missing them, and keeps status", () => {
    const first = mergeProfile(null, { ...base, name: "Riya", followers: 100, links: ["https://a.in/"] }, { source: "link", now: 1 });
    const second = mergeProfile({ ...first, status: "contacted" }, { ...base, followers: 150 }, { source: "extension", now: 5, notes: "second look" });
    expect(second).toMatchObject({ name: "Riya", followers: 150, links: ["https://a.in/"], status: "contacted", createdAt: 1, updatedAt: 5, capturedAt: 5, source: "link", notes: "second look" });
  });
});

describe("addNotes", () => {
  it("appends on a new line and ignores blanks", () => {
    expect(addNotes("a", " b ")).toBe("a\nb");
    expect(addNotes("a", "  ")).toBe("a");
    expect(addNotes("", "b")).toBe("b");
  });
});
