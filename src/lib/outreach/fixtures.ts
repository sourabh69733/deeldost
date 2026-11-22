// Test data for outreach tests.
import { profileFromUrl, type ExtractedProfile } from "@/lib/people/extract";
import { mergeProfile, type Person } from "@/lib/people/person";
import type { Research } from "@/lib/people/research";

export const makePerson = (url: string, extra: Partial<Person> = {}, profile: Partial<ExtractedProfile> = {}): Person => ({
  ...mergeProfile(null, { ...(profileFromUrl(url) as ExtractedProfile), ...profile }, { source: "extension", now: 1 }),
  ...extra,
});

export const research = (r: Partial<Research> = {}): Research => ({
  niche: "travel", nicheSource: "rules", themes: [], summary: null, audience: null, location: null, languages: [],
  brands: ["SecretBrand"], pitch: null, emails: ["private@mail.com"], rate: null, sources: [], usedAi: false, researchedAt: 1, ...r,
});
