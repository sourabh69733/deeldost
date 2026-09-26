// All pricing numbers live here so they can be tuned without touching UI.
// These are STARTING GUESSES. Calibrate with real creator deal data.

export type Platform = "instagram" | "youtube";

export const NICHES = {
  finance: { label: "Finance", cpm: [600, 1200] },
  tech: { label: "Tech", cpm: [500, 1000] },
  beauty: { label: "Beauty", cpm: [450, 900] },
  fashion: { label: "Fashion", cpm: [400, 800] },
  fitness: { label: "Fitness", cpm: [350, 750] },
  food: { label: "Food", cpm: [350, 700] },
  lifestyle: { label: "Lifestyle", cpm: [350, 700] },
  travel: { label: "Travel", cpm: [350, 700] },
  entertainment: { label: "Entertainment", cpm: [250, 500] },
  other: { label: "Other", cpm: [250, 500] },
} as const;

export type Niche = keyof typeof NICHES;

export const DELIVERABLES = {
  reel: { label: "Reel", platform: "instagram", multiplier: 1.0 },
  static: { label: "Static post", platform: "instagram", multiplier: 0.6 },
  stories: { label: "Stories (set of 3)", platform: "instagram", multiplier: 0.4 },
  yt_integration: { label: "YouTube integration", platform: "youtube", multiplier: 1.5 },
  yt_short: { label: "YouTube Short", platform: "youtube", multiplier: 0.8 },
} as const;

export type Deliverable = keyof typeof DELIVERABLES;

// views / followers ratio → multiplier
export const ENGAGEMENT_BANDS = [
  { maxRatio: 0.1, multiplier: 0.8, note: "Views are low compared to followers" },
  { maxRatio: 0.3, multiplier: 1.0, note: "Normal reach for your size" },
  { maxRatio: 0.6, multiplier: 1.2, note: "Strong reach, you can charge more" },
  { maxRatio: Infinity, multiplier: 1.4, note: "Excellent reach, brands will value this" },
];

export const ADD_ONS = {
  usageRights: { label: "Usage rights (brand runs it as an ad)", multiplier: 1.4 },
  exclusivity: { label: "Exclusivity (no competitor brands for 30 days)", multiplier: 1.2 },
  linkInBio: { label: "Link in bio", multiplier: 1.1 },
  extraRevisions: { label: "More than 1 revision", multiplier: 1.1 },
} as const;

export type AddOn = keyof typeof ADD_ONS;

export const RANGE = { low: 0.75, high: 1.35 };
export const MIN_PRICE = 1500;
