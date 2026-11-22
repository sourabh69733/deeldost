// Wrapped numbers and fun copy. Tune here, not in the UI.

// Instagram rate-limits apps per user, so cap how many reels we ask view counts for.
export const INSIGHTS_CAP = 60;
// Stop paging through media after this many posts (8 pages of 50).
export const MEDIA_CAP = 400;

// "If every view were a seat": largest first. Views are not unique people, so the copy says "views".
export const VENUES = [
  { name: "Narendra Modi Stadium", seats: 132_000 },
  { name: "Eden Gardens", seats: 68_000 },
  { name: "Wankhede Stadium", seats: 33_000 },
  { name: "a cinema hall", seats: 250 },
] as const;

export const PERSONAS = {
  viral: { emoji: "🚀", title: "The Viral One", line: "One reel took off and dragged the algorithm along with it." },
  talker: { emoji: "💬", title: "The Conversation Starter", line: "People don't just like your posts. They reply." },
  steady: { emoji: "📅", title: "The Consistent One", line: "You kept showing up, week after week. That's the whole game." },
  loved: { emoji: "💖", title: "The Crowd Favourite", line: "The people who watch you really engage. Brands love that." },
  rising: { emoji: "🌱", title: "The Rising One", line: "Quietly building. Next year is yours." },
} as const;
export type PersonaId = keyof typeof PERSONAS;

// Persona rules, checked in this order.
export const PERSONA_RULES = {
  viralTimesMedian: 5, // top reel views at least 5x the typical reel
  viralMinViews: 10_000,
  talkerCommentsPerLike: 0.06,
  talkerMinComments: 50,
  steadyWeeks: 8,
  lovedEngagement: 0.06, // (likes + comments) / views, typical reel
} as const;

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
