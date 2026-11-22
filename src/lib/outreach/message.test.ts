import { describe, expect, it } from "vitest";
import { draftMessages } from "./message";
import { makePerson, research } from "./fixtures";

const URL = "https://dealdost.in/p/abcdefghijkl";

describe("draftMessages", () => {
  it("mentions their theme, the reel price and the page link", () => {
    const p = makePerson("instagram.com/riya", { research: research({ themes: ["Himalayan treks"] }) }, { name: "Riya Sharma", followers: 25_000 });
    const d = draftMessages(p, URL, "Sourabh Sahu");
    expect(d.dm).toMatch(/^Hi Riya! Really like your himalayan treks posts\. /);
    expect(d.dm).toMatch(/for a reel \(around ₹[\d,]+\)/);
    expect(d.dm).toContain(URL);
    expect(d.dm).toMatch(/Sourabh$/);
    expect(d.emailSubject).toBe("Riya, what brands should pay you");
    expect(d.emailBody).toContain("I'm Sourabh from DealDost");
    expect(d.emailBody).toContain("button on it to remove it");
  });

  it("falls back to niche and tips when there is no theme or rate", () => {
    const p = makePerson("instagram.com/tiny", {}, { name: "Nikita karodiya", followers: 124, bio: "Travel . trekking" });
    const d = draftMessages(p, URL, null);
    expect(d.dm).toContain("Really like your travel posts.");
    expect(d.dm).toContain("tips on getting paid brand deals");
    expect(d.dm).toMatch(/DealDost$/);
    expect(d.emailSubject).toBe("Nikita, a few tips for brand deals");
  });

  it("has no em dashes", () => {
    const d = draftMessages(makePerson("instagram.com/riya", {}, { followers: 25_000 }), URL, "A");
    expect(`${d.dm}${d.emailSubject}${d.emailBody}`).not.toContain("—");
  });
});
