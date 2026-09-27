// A shareable rate card: every deliverable on the platform with its fair price, plus add-on surcharges.
// The card is described entirely by a short query string, so the image URL is stable and cacheable.
import { z } from "zod";
import { calculateRate } from "./calculate";
import { ADD_ONS, DELIVERABLES, NICHES, type AddOn, type Deliverable, type Niche, type Platform } from "./config";

export const RateCardParams = z.object({
  platform: z.enum(["instagram", "youtube"]),
  followers: z.coerce.number().int().positive().max(1e9),
  avgViews: z.coerce.number().int().positive().max(1e9),
  niche: z.enum(Object.keys(NICHES) as [Niche, ...Niche[]]),
  // Instagram-style handle, without the @.
  handle: z.string().regex(/^[A-Za-z0-9._]{1,30}$/).optional(),
});
export type RateCardParams = z.infer<typeof RateCardParams>;

export type RateCard = RateCardParams & {
  rows: { deliverable: Deliverable; label: string; price: number }[];
  addOns: { id: AddOn; label: string; percent: number }[];
};

// Short keys keep shared links tidy.
const KEYS = { platform: "p", followers: "f", avgViews: "v", niche: "n", handle: "h" } as const;

export function rateCardQuery(p: RateCardParams): string {
  const q = new URLSearchParams();
  for (const [field, key] of Object.entries(KEYS)) {
    const value = p[field as keyof RateCardParams];
    if (value !== undefined && value !== "") q.set(key, String(value));
  }
  return q.toString();
}

export function parseRateCardQuery(q: URLSearchParams): RateCardParams | null {
  const raw = Object.fromEntries(Object.entries(KEYS).map(([field, key]) => [field, q.get(key) ?? undefined]));
  const parsed = RateCardParams.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function buildRateCard(p: RateCardParams): RateCard {
  const rows = (Object.keys(DELIVERABLES) as Deliverable[])
    .filter((d) => DELIVERABLES[d].platform === (p.platform satisfies Platform))
    .map((d) => ({
      deliverable: d,
      label: DELIVERABLES[d].label,
      price: calculateRate({ deliverable: d, followers: p.followers, avgViews: p.avgViews, niche: p.niche, addOns: [] }).fair,
    }));
  const addOns = (Object.keys(ADD_ONS) as AddOn[]).map((id) => ({
    id,
    label: ADD_ONS[id].label,
    percent: Math.round((ADD_ONS[id].multiplier - 1) * 100),
  }));
  return { ...p, rows, addOns };
}
