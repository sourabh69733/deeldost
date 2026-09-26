import {
  ADD_ONS, AddOn, DELIVERABLES, Deliverable, ENGAGEMENT_BANDS,
  MIN_PRICE, NICHES, Niche, RANGE,
} from "./config";

export type RateInput = {
  deliverable: Deliverable;
  followers: number;
  avgViews: number;
  niche: Niche;
  addOns: AddOn[];
};

export type RateResult = {
  low: number;
  fair: number;
  high: number;
  engagementNote: string;
  explanation: string;
};

const roundNice = (n: number) => {
  const step = n < 10000 ? 250 : n < 100000 ? 500 : 1000;
  return Math.max(MIN_PRICE, Math.round(n / step) * step);
};

export function calculateRate(input: RateInput): RateResult {
  const { deliverable, followers, avgViews, niche, addOns } = input;
  const [cpmLow, cpmHigh] = NICHES[niche].cpm;
  const cpm = (cpmLow + cpmHigh) / 2;

  const base = (avgViews / 1000) * cpm;
  const ratio = followers > 0 ? avgViews / followers : 0;
  const band = ENGAGEMENT_BANDS.find((b) => ratio <= b.maxRatio)!;
  const addOnMult = addOns.reduce((m, a) => m * ADD_ONS[a].multiplier, 1);

  const fairRaw = base * DELIVERABLES[deliverable].multiplier * band.multiplier * addOnMult;

  return {
    low: roundNice(fairRaw * RANGE.low),
    fair: roundNice(fairRaw),
    high: roundNice(fairRaw * RANGE.high),
    engagementNote: band.note,
    explanation: `Based on ${avgViews.toLocaleString("en-IN")} average views, a typical ${NICHES[niche].label.toLowerCase()} rate of about ₹${Math.round(cpm)} per 1,000 views, and your ${DELIVERABLES[deliverable].label.toLowerCase()}${addOns.length ? " with add-ons" : ""}.`,
  };
}
