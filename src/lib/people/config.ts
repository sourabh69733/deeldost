// Creator research (admin only): people we save from social profiles and websites, and where they are in our outreach.
// Client-safe: no server imports here.

export const PLATFORMS = {
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
  website: "Website",
} as const;
export type Platform = keyof typeof PLATFORMS;

/** Outreach pipeline, in order. */
export const STATUSES = {
  saved: "Saved",
  researched: "Researched",
  page_ready: "Page ready",
  contacted: "Contacted",
  replied: "Replied",
  signed_up: "Signed up",
  dropped: "Dropped",
} as const;
export type Status = keyof typeof STATUSES;
export const STATUS_KEYS = Object.keys(STATUSES) as Status[];

export const LIMITS = {
  bio: 600,
  notes: 2000,
  links: 10,
  posts: 12,
  caption: 300,
  /** Most people the dashboard loads at once. */
  list: 500,
} as const;

/** Captures per hour from the extension, per admin. */
export const CAPTURES_PER_HOUR = 300;
