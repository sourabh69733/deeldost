// A saved person and how a new capture merges into what we already have.
import { createHash } from "node:crypto";
import { LIMITS, type Platform, type Status } from "./config";
import type { ExtractedProfile, RecentPost } from "./extract";

export type Source = "extension" | "link";

export type Person = {
  id: string;
  platform: Platform;
  handle: string | null;
  url: string;
  name: string | null;
  bio: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  links: string[];
  recentPosts: RecentPost[];
  notes: string;
  status: Status;
  source: Source;
  createdAt: number;
  updatedAt: number;
  /** Last time the extension read their page. */
  capturedAt: number | null;
};

/** Stable doc id: platform + handle, or a hash of the URL when there is no handle. */
export function personId(p: { platform: Platform; handle: string | null; url: string }): string {
  if (p.handle && /^[a-z0-9._-]{1,64}$/.test(p.handle)) return `${p.platform}_${p.handle}`;
  return `${p.platform}_${createHash("sha256").update(p.url).digest("hex").slice(0, 16)}`;
}

/** Appends new notes under old ones, within the size limit. */
export function addNotes(old: string, added: string | undefined): string {
  const a = (added ?? "").trim();
  if (!a) return old;
  return (old ? `${old}\n${a}` : a).slice(-LIMITS.notes);
}

/** New values win; missing values keep what we had. Status and created time never change here. */
export function mergeProfile(existing: Person | null, profile: ExtractedProfile, opts: { source: Source; now: number; notes?: string }): Person {
  const pick = <T,>(next: T | null, old: T | null | undefined): T | null => next ?? old ?? null;
  const captured = opts.source === "extension";
  return {
    id: personId(profile),
    platform: profile.platform,
    handle: profile.handle,
    url: profile.url,
    name: pick(profile.name, existing?.name),
    bio: pick(profile.bio, existing?.bio),
    followers: pick(profile.followers, existing?.followers),
    following: pick(profile.following, existing?.following),
    posts: pick(profile.posts, existing?.posts),
    links: profile.links.length ? profile.links : existing?.links ?? [],
    recentPosts: profile.recentPosts.length ? profile.recentPosts : existing?.recentPosts ?? [],
    notes: addNotes(existing?.notes ?? "", opts.notes),
    status: existing?.status ?? "saved",
    source: existing?.source ?? opts.source,
    createdAt: existing?.createdAt ?? opts.now,
    updatedAt: opts.now,
    capturedAt: captured ? opts.now : existing?.capturedAt ?? null,
  };
}
