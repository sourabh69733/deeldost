import { describe, expect, it } from "vitest";
import { NICHE_TIPS, SAFETY_TIP } from "./config";
import { makePerson, research } from "./fixtures";
import { buildPublicPage, firstName } from "./page";

describe("firstName", () => {
  it("uses the first word of a real name", () => {
    expect(firstName({ name: "riya Sharma ✨", handle: "riya" })).toBe("Riya");
    expect(firstName({ name: "✨✨", handle: "riya.travels" })).toBe("@riya.travels");
    expect(firstName({ name: null, handle: null })).toBe("there");
  });
});

describe("buildPublicPage", () => {
  it("shows rates, themes and tips for an Instagram creator", () => {
    const p = makePerson("instagram.com/riya", { research: research({ themes: ["Treks", "#travel", "Cafés", "Sunsets", "Food"] }) }, { name: "Riya Sharma", followers: 25_000, posts: 300 });
    const page = buildPublicPage(p);
    expect(page).toMatchObject({ firstName: "Riya", handle: "riya", followers: 25_000, nicheLabel: "Travel", themes: ["Treks", "Cafés", "Sunsets"] });
    expect(page.rates?.assumedViews).toBe(5_000);
    expect(page.rates?.rows.map((r) => r.label)).toEqual(["Reel", "Static post", "Stories (set of 3)"]);
    expect(page.rates?.imageQuery).toContain("h=riya");
    expect(page.tips).toHaveLength(3);
    expect(page.tips[1]).toBe(NICHE_TIPS.travel);
    expect(page.tips[2]).toBe(SAFETY_TIP);
  });

  it("never exposes notes, emails or brands", () => {
    const p = makePerson("instagram.com/riya", { notes: "secret note", research: research() }, { followers: 25_000 });
    const json = JSON.stringify(buildPublicPage(p));
    expect(json).not.toContain("secret note");
    expect(json).not.toContain("private@mail.com");
    expect(json).not.toContain("SecretBrand");
  });

  it("skips rates for small accounts and other platforms, and guesses niche without research", () => {
    const small = buildPublicPage(makePerson("instagram.com/tiny", {}, { followers: 124, bio: "Travel . trekking" }));
    expect(small.rates).toBeNull();
    expect(small.nicheLabel).toBe("Travel");
    expect(small.tips[0]).toMatch(/Under 1,000/);
    expect(buildPublicPage(makePerson("x.com/someone", {}, { followers: 50_000 })).rates).toBeNull();
    expect(buildPublicPage(makePerson("youtube.com/@techguru", {}, { followers: 50_000 })).rates?.rows[0].label).toBe("YouTube integration");
  });
});
