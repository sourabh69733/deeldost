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

/** Hashtags used only for reach, which say nothing about what someone posts. */
export const GENERIC_TAGS = new Set([
  "fyp", "foryou", "foryoupage", "trending", "trend", "trendingreels", "viral", "viralreels", "viralpost", "viralvideo",
  "explore", "explorepage", "explorepage✨", "reels", "reel", "reelsinstagram", "reelitfeelit", "instagood", "instadaily",
  "instagram", "insta", "contentcreator", "creator", "love", "like", "likes", "like4like", "follow", "followme",
  "follow4follow", "newpost", "photooftheday", "picoftheday", "ᴠɪʀᴀʟᴘᴏst",
]);

/** Fewest followers for a rate guess; below this the minimum price makes it meaningless. */
export const MIN_FOLLOWERS_FOR_RATE = 1000;

/** Research runs per hour, per admin (each can make one Claude call). */
export const RESEARCH_PER_HOUR = 60;

/**
 * We don't see their views, so the rate estimate assumes typical reel views = followers x this.
 * 0.2 sits in the "normal reach" band of pricing/config.ts.
 */
export const ASSUMED_VIEW_RATIO = 0.2;

/**
 * Words (matched at the start of a word, so "travel" also finds "travelling") that point to a niche.
 * Keys match NICHES in pricing/config.ts. Avoid short words that start other words ("ca" → "cafe").
 */
export const NICHE_KEYWORDS = {
  finance: ["finance", "stock", "invest", "trading", "trader", "mutual fund", "personal finance", "money", "crypto", "income tax", "budget", "sharemarket", "nifty"],
  tech: ["tech", "gadget", "smartphone", "unboxing", "laptop", "coding", "developer", "programm", "software", "android", "iphone"],
  beauty: ["makeup", "skincare", "skin care", "beauty", "mua", "nails", "haircare", "hair care", "lipstick", "glow"],
  fashion: ["fashion", "outfit", "ootd", "style", "styling", "saree", "lehenga", "kurti", "streetwear", "wardrobe", "model"],
  fitness: ["fitness", "gym", "workout", "yoga", "diet", "nutrition", "protein", "transformation", "athlete", "running"],
  food: ["food", "recipe", "cook", "chef", "baking", "baker", "restaurant", "cafe", "street food", "foodie", "khana"],
  lifestyle: ["lifestyle", "vlog", "daily", "dailyvlog", "family", "motherhood", "mommy", "home decor", "minimal", "self care", "aesthetic"],
  travel: ["travel", "trip", "wander", "trek", "mountain", "backpack", "himalaya", "beach", "roadtrip"],
  entertainment: ["comedy", "funny", "meme", "dance", "acting", "actor", "actress", "singer", "music", "standup", "skit"],
} as const;
