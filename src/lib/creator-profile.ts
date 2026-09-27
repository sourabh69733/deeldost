// Browser only: remembers the creator's numbers on this device so the rate calculator
// and brand checker can share them. Storage can be blocked, so every access is guarded.
import { NICHES } from "@/lib/pricing/config";
import type { CreatorStats } from "@/lib/brand-check/pay-check";

const KEY = "dealdost:creator";

export function loadCreatorProfile(): CreatorStats | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "null");
    const valid = p && p.followers > 0 && p.avgViews > 0 && p.niche in NICHES;
    return valid ? { followers: p.followers, avgViews: p.avgViews, niche: p.niche } : null;
  } catch {
    return null;
  }
}

export function saveCreatorProfile(profile: CreatorStats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable: nothing to remember */
  }
}
