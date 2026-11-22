import { describe, expect, it } from "vitest";
import { cleanCaption, extractProfile, profileFromUrl } from "./extract";

describe("extractProfile", () => {
  it("reads an Instagram profile header", () => {
    const p = extractProfile({
      url: "https://www.instagram.com/chai.with.riya/",
      title: "Riya Sharma (@chai.with.riya) • Instagram photos and videos",
      description: "45.6K Followers, 300 Following, 812 Posts - See Instagram photos and videos from Riya Sharma (@chai.with.riya)",
      text: "chai.with.riya\nFollow\nMessage\n812 posts\n45.6K followers\n300 following\nRiya Sharma\nDigital creator\nChai, books and Jaipur cafés ☕\nCollabs: riya@mail.com\nFollowed by amit and 3 others",
      links: [
        "https://l.instagram.com/?u=https%3A%2F%2Flinktr.ee%2Friya&e=AT0",
        "https://www.instagram.com/chai.with.riya/followers/",
        "not a link",
      ],
      posts: [
        { url: "https://www.instagram.com/p/AAA/?img_index=1", caption: "Chai time ☕ May be an image of tea." },
        { url: "https://www.instagram.com/p/AAA/", caption: "dup" },
        { url: "https://www.instagram.com/reel/BBB/" },
      ],
    });
    expect(p).toMatchObject({
      platform: "instagram",
      handle: "chai.with.riya",
      name: "Riya Sharma",
      followers: 45600,
      following: 300,
      posts: 812,
      bio: "Digital creator\nChai, books and Jaipur cafés ☕\nCollabs: riya@mail.com",
      links: ["https://linktr.ee/riya"],
    });
    expect(p?.recentPosts).toEqual([
      { url: "https://www.instagram.com/p/AAA/", caption: "Chai time ☕" },
      { url: "https://www.instagram.com/reel/BBB/", caption: null },
    ]);
  });

  it("reads the current Instagram layout without story highlight names", () => {
    const p = extractProfile({
      url: "https://www.instagram.com/some.creator_/",
      title: "Some Creator (@some.creator_) • Instagram photos and videos",
      text: "some.creator_\nSome Creator\n95 posts\n124 followers\n0 following\nTravel . lifestyle\n.\nunfeigned\nFollowing\nMessage\nUdaipur\nGujarat\nFst✨\nPunjab",
    });
    expect(p).toMatchObject({ name: "Some Creator", followers: 124, following: 0, posts: 95, bio: "Travel . lifestyle\n.\nunfeigned" });
  });

  it("ignores an Instagram meta description left over from another profile", () => {
    const p = extractProfile({
      url: "https://www.instagram.com/new.person/",
      description: "9M Followers, 1 Following, 5 Posts - See Instagram photos and videos from Old (@old.person)",
    });
    expect(p?.followers).toBeNull();
  });

  it("reads a YouTube channel", () => {
    const p = extractProfile({
      url: "https://www.youtube.com/@techguru",
      title: "Tech Guru - YouTube",
      description: "Honest phone reviews in Hindi.",
      text: "Tech Guru\n@techguru • 1.2M subscribers • 845 videos",
      links: ["https://www.youtube.com/redirect?q=https%3A%2F%2Finstagram.com%2Ftechguru", "https://www.youtube.com/@techguru/videos"],
    });
    expect(p).toMatchObject({ name: "Tech Guru", bio: "Honest phone reviews in Hindi.", followers: 1200000, posts: 845, following: null, links: ["https://instagram.com/techguru"] });
  });

  it("keeps only social links for a website and no counts", () => {
    const p = extractProfile({
      url: "https://riya.in/about",
      ogTitle: "Riya Sharma",
      description: "Creator from Jaipur.",
      text: "50K followers on Instagram",
      links: ["https://riya.in/blog", "https://instagram.com/riya", "https://wa.me/919999999999"],
    });
    expect(p).toMatchObject({ platform: "website", name: "Riya Sharma", bio: "Creator from Jaipur.", followers: null, links: ["https://instagram.com/riya", "https://wa.me/919999999999"] });
  });

  it("returns null for links that are not profiles", () => {
    expect(extractProfile({ url: "https://www.instagram.com/p/ABC/" })).toBeNull();
  });
});

describe("cleanCaption", () => {
  it("drops Instagram's automatic image descriptions", () => {
    expect(cleanCaption("Photo by Nikita on November 18, 2026. May be an image of lake, mountain and text.")).toBeNull();
    expect(cleanCaption("Photo shared by Riya on November 14, 2026 tagging @amit. May be an image of dress.")).toBeNull();
    expect(cleanCaption("Sunrise trek ☀️ #travel May be an image of mountain")).toBe("Sunrise trek ☀️ #travel");
    expect(cleanCaption("Did you understand..?? #fyp")).toBe("Did you understand..?? #fyp");
    expect(cleanCaption(null)).toBeNull();
  });
});

describe("profileFromUrl", () => {
  it("gives empty fields for a pasted link", () => {
    expect(profileFromUrl("x.com/someone")).toEqual({
      platform: "x", handle: "someone", url: "https://x.com/someone",
      name: null, bio: null, followers: null, following: null, posts: null, links: [], recentPosts: [],
    });
  });
});
