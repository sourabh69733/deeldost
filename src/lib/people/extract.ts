// Turns what the extension read from a page into profile fields. The raw page text is used here and then dropped:
// only the fields below are stored.
import { z } from "zod";
import { LIMITS } from "./config";
import { findCount } from "./count";
import { parseProfileUrl, unwrapLink, type ProfileRef } from "./url";

/** What the browser extension sends. Lenient: bad links are dropped later, not rejected. */
export const CapturePayload = z.object({
  url: z.string().min(1).max(2000),
  title: z.string().max(500).optional(),
  ogTitle: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  /** Visible text of the profile header (not stored). */
  text: z.string().max(6000).optional(),
  links: z.array(z.string().max(2000)).max(60).optional(),
  posts: z.array(z.object({ url: z.string().max(2000), caption: z.string().max(2000).optional() })).max(30).optional(),
  notes: z.string().max(LIMITS.notes).optional(),
});
export type CapturePayload = z.infer<typeof CapturePayload>;

export type RecentPost = { url: string; caption: string | null };

export type ExtractedProfile = ProfileRef & {
  name: string | null;
  bio: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  links: string[];
  recentPosts: RecentPost[];
};

const FOLLOWERS = ["followers", "follower", "subscribers", "subscriber"];
const FOLLOWING = ["following"];
const POSTS = ["posts", "post", "videos", "video"];
const SOCIAL_HOSTS = /(^|\.)(instagram\.com|youtube\.com|youtu\.be|x\.com|twitter\.com|linkedin\.com|facebook\.com|linktr\.ee|threads\.net|t\.me|wa\.me)$/;
// Instagram header lines that are buttons or labels, not bio.
const IG_NOISE = /^(follow|following|message|edit profile|view archive|see translation|more|options|contact|email|call|directions|shop|followed by .*|\d.*\b(posts?|followers?|following)\b.*)$/i;

const clean = (s: string | null | undefined, max: number) => {
  const t = (s ?? "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return t ? t.slice(0, max) : null;
};

function httpUrl(href: string): URL | null {
  try {
    const u = new URL(unwrapLink(href.trim()));
    return u.protocol === "https:" || u.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
}

/** Name from page titles like "Name (@handle) • Instagram ...", "Name - YouTube", "Name - Title | LinkedIn". */
function nameFromTitle(ref: ProfileRef, title: string | undefined): string | null {
  if (!title) return null;
  let t = title.replace(/^\(\d+\)\s*/, ""); // "(3) Name ..." unread counter
  if (ref.platform === "instagram" || ref.platform === "x") t = t.replace(/\s*\(@[^)]*\).*$/, "");
  else if (ref.platform === "youtube") t = t.replace(/\s*-\s*YouTube\s*$/i, "");
  else if (ref.platform === "linkedin") t = t.replace(/\s*\|\s*LinkedIn\s*$/i, "").split(/\s+-\s+/)[0];
  t = t.trim();
  if (!t || /^(instagram|youtube|x|linkedin)$/i.test(t)) return null;
  return t.slice(0, 120);
}

/** Bio lines from Instagram's header text: what comes after the counts, minus buttons and the name. */
function instagramBio(text: string | undefined, handle: string | null, name: string | null): string | null {
  if (!text) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const countsAt = lines.findLastIndex((l) => /\bfollowing\b/i.test(l) && /\d/.test(l));
  const rest = (countsAt >= 0 ? lines.slice(countsAt + 1) : lines)
    .filter((l) => !IG_NOISE.test(l) && l.toLowerCase() !== handle && l !== name);
  return clean(rest.join("\n"), LIMITS.bio);
}

export function extractProfile(p: CapturePayload): ExtractedProfile | null {
  const ref = parseProfileUrl(p.url);
  if (!ref) return null;

  const name = nameFromTitle(ref, p.ogTitle) ?? nameFromTitle(ref, p.title);
  // Instagram's meta description can be left over from the previous profile (single-page app), so only
  // trust it when it names this handle.
  const desc = p.description && (ref.platform !== "instagram" || p.description.toLowerCase().includes(`@${ref.handle}`)) ? p.description : undefined;
  const count = (words: string[]) => findCount(p.text, words) ?? findCount(desc, words);

  const bio = ref.platform === "instagram" ? instagramBio(p.text, ref.handle, name) : clean(desc, LIMITS.bio);

  const ownHost = new URL(ref.url).hostname.replace(/^www\./, "");
  const links = [...new Set((p.links ?? []).map((h) => httpUrl(h)).filter((u): u is URL => !!u)
    .filter((u) => {
      const host = u.hostname.replace(/^www\./, "");
      // On a website keep only its social links; on a profile keep only links that leave the platform.
      return ref.platform === "website" ? SOCIAL_HOSTS.test(host) : !host.endsWith(ownHost);
    })
    .map((u) => u.toString()))].slice(0, LIMITS.links);

  const seen = new Set<string>();
  const recentPosts: RecentPost[] = [];
  for (const post of p.posts ?? []) {
    const u = httpUrl(post.url);
    if (!u) continue;
    const url = `${u.origin}${u.pathname}`;
    if (seen.has(url)) continue;
    seen.add(url);
    recentPosts.push({ url, caption: clean(post.caption, LIMITS.caption) });
    if (recentPosts.length >= LIMITS.posts) break;
  }

  const isProfile = ref.platform !== "website";
  return {
    ...ref,
    name,
    bio,
    followers: isProfile ? count(FOLLOWERS) : null,
    following: isProfile ? count(FOLLOWING) : null,
    posts: isProfile ? count(POSTS) : null,
    links,
    recentPosts,
  };
}

/** A profile from just a link (the "Add by link" form): no page data yet. */
export function profileFromUrl(url: string): ExtractedProfile | null {
  return extractProfile({ url });
}
