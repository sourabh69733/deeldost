// Turns any pasted or captured link into a platform + handle + clean URL, so the same person is saved once.
import type { Platform } from "./config";

export type ProfileRef = { platform: Platform; handle: string | null; url: string };

// First path parts that are Instagram or X pages, not usernames.
const IG_RESERVED = new Set(["p", "reel", "reels", "explore", "stories", "accounts", "direct", "about", "legal", "developer", "tv", "web", "challenge", "emails", "oauth", "ar"]);
const X_RESERVED = new Set(["home", "explore", "i", "search", "notifications", "messages", "settings", "compose", "login", "signup", "tos", "privacy", "intent", "share", "hashtag"]);

export function parseProfileUrl(raw: string): ProfileRef | null {
  const text = raw.trim();
  if (!text) return null;
  let u: URL;
  try {
    u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m|mobile)\./, "");
  if (!host.includes(".")) return null;
  const parts = u.pathname.split("/").filter(Boolean).map((p) => decodeURIComponent(p));
  const [first = "", second = ""] = parts;

  if (host === "instagram.com") {
    const h = first.toLowerCase();
    if (!/^[a-z0-9._]{1,30}$/.test(h) || IG_RESERVED.has(h)) return null;
    return { platform: "instagram", handle: h, url: `https://www.instagram.com/${h}/` };
  }

  if (host === "youtube.com") {
    if (first.startsWith("@") && /^@[A-Za-z0-9._-]{3,30}$/.test(first)) {
      const h = first.slice(1).toLowerCase();
      return { platform: "youtube", handle: h, url: `https://www.youtube.com/@${h}` };
    }
    if (["channel", "c", "user"].includes(first) && /^[A-Za-z0-9._-]{1,64}$/.test(second)) {
      return { platform: "youtube", handle: null, url: `https://www.youtube.com/${first}/${second}` };
    }
    return null;
  }

  if (host === "x.com" || host === "twitter.com") {
    const h = first.toLowerCase();
    if (!/^[a-z0-9_]{1,15}$/.test(h) || X_RESERVED.has(h)) return null;
    return { platform: "x", handle: h, url: `https://x.com/${h}` };
  }

  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
    if (first !== "in" || !second) return null;
    const h = second.toLowerCase();
    return { platform: "linkedin", handle: h, url: `https://www.linkedin.com/in/${encodeURIComponent(h)}/` };
  }

  // Any other site (Linktree, personal site, shop): keep host + path, drop query and #hash.
  const path = u.pathname.replace(/\/+$/, "");
  return { platform: "website", handle: null, url: `${u.protocol}//${u.host.toLowerCase()}${path}` };
}

/** Instagram wraps outside links as l.instagram.com/?u=...; return the real link. */
export function unwrapLink(href: string): string {
  try {
    const u = new URL(href);
    if (/(^|\.)l\.instagram\.com$/.test(u.hostname) || u.hostname === "l.facebook.com") return u.searchParams.get("u") ?? href;
    if (u.hostname.endsWith("youtube.com") && u.pathname === "/redirect") return u.searchParams.get("q") ?? href;
    return href;
  } catch {
    return href;
  }
}
