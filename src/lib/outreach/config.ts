// Personal pages and first messages for creators we reach out to. Copy lives here so it can be tuned
// without touching the UI. Plain, friendly English; no promises we can't keep.
import type { Niche } from "@/lib/pricing/config";

/** One tip per niche, shown on their page. */
export const NICHE_TIPS: Record<Niche, string> = {
  finance: "Finance brands pay some of the highest rates, but they check compliance closely. Keep a note of SEBI rules for any money advice in sponsored posts.",
  tech: "Tech brands often send a product and ask for a free review. A product is not payment: quote a fee for the video and let them keep the unit if they want.",
  beauty: "Beauty brands value before-and-after content and honest reviews. Charge extra if they want to use your face in their ads.",
  fashion: "Fashion brands love try-on reels. If they want you to wear only their brand for a while, that is exclusivity, so charge for it.",
  fitness: "Fitness brands trust creators who show real routines. Ask for a longer deal (3 posts over 3 months) instead of one post.",
  food: "Food brands and restaurants often offer a free meal. That is fine for small accounts, but ask for a fee once you have a few collabs to show.",
  lifestyle: "Lifestyle creators can work with many kinds of brands. Pick 3 brands you already use and pitch them first.",
  travel: "Hotels and travel brands often offer a free stay. Count what the stay is worth against your rate, and ask for the difference in cash.",
  entertainment: "Brands like funny, shareable reels. Ask them for the idea, not the script: your style is why your audience watches.",
  other: "Brands pay for trust, not just followers. Show them comments where your audience asks you for advice.",
};

/** One tip by account size (followers), shown on their page. First match wins. */
export const SIZE_TIPS: { maxFollowers: number; tip: string }[] = [
  { maxFollowers: 1_000, tip: "Under 1,000 followers, barter deals are normal. After 3 good collabs, start asking for a small fee as well." },
  { maxFollowers: 10_000, tip: "Nano creators often get better engagement than big accounts. Show brands your views and comments, not just followers." },
  { maxFollowers: 100_000, tip: "At your size brands should pay cash, not just products. Have a rate card ready before they ask." },
  { maxFollowers: Infinity, tip: "Brands may ask for usage rights (running your video as an ad). That is worth 30 to 50% extra." },
];

/** Shown to everyone. */
export const SAFETY_TIP = "Never pay a brand to start a collab. Asking for a registration fee or a deposit is the most common scam. Ask for 50% before you post.";

/** Who the first message is from, when the admin has no name on their Google account. */
export const DEFAULT_SENDER = "DealDost";

/** Page views and clicks counted per visitor IP per hour. */
export const PAGE_EVENTS_PER_HOUR = 60;
