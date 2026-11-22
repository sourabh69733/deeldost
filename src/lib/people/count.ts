// Reads follower-style counts as shown on profiles: "1,234", "45.6K", "1.2M", "12.5 lakh", "1 Cr".

const UNITS: Record<string, number> = {
  k: 1e3, thousand: 1e3,
  m: 1e6, million: 1e6,
  b: 1e9, billion: 1e9,
  l: 1e5, lac: 1e5, lakh: 1e5, lakhs: 1e5,
  cr: 1e7, crore: 1e7, crores: 1e7,
};

// Longest units first so "lakh" wins over "l".
const UNIT_RE = Object.keys(UNITS).sort((a, b) => b.length - a.length).join("|");
// A number with an optional unit. Groups: 1 = number, 2 = unit.
const COUNT_RE = String.raw`(\d[\d,]*(?:\.\d+)?)\s*(${UNIT_RE})?\b\+?`;

function toNumber(num: string, unit: string | undefined): number | null {
  const n = Number(num.replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * (unit ? UNITS[unit.toLowerCase()] : 1));
}

export function parseCount(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.trim().match(new RegExp(`^${COUNT_RE}$`, "i"));
  return m ? toNumber(m[1], m[2]) : null;
}

/** First count followed by one of the words, e.g. findCount("45.6K followers", ["followers"]) = 45600. */
export function findCount(text: string | null | undefined, words: string[]): number | null {
  if (!text) return null;
  const m = text.match(new RegExp(`${COUNT_RE}\\s*(?:${words.join("|")})\\b`, "i"));
  return m ? toNumber(m[1], m[2]) : null;
}
