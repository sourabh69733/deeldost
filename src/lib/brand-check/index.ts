// The full brand check: rules -> domain -> AI -> one combined result.
// Rules and domain always run; AI only adds to them.
import "server-only";
import { z } from "zod";
import { checkDomain } from "./domain-check";
import { runRedFlags, scoreRisk, type Risk } from "./red-flags";
import { getAiReview } from "./ai-review";
import type { BrandCheckResult } from "./types";

export type { BrandCheckResult } from "./types";

export const BrandCheckInput = z.object({
  brandName: z.string().trim().min(1, "Enter the brand name").max(120),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  instagram: z.string().trim().max(100).optional().or(z.literal("")),
  message: z.string().trim().min(20, "Paste the full message (at least 20 characters)").max(8000),
});
export type BrandCheckInput = z.infer<typeof BrandCheckInput>;

const DEFAULT_QUESTIONS = [
  "Can you share your company website and official email?",
  "What is the exact payment amount and when will you pay?",
  "Can you send a written agreement before I start?",
];

const RISK_ORDER: Record<Risk, number> = { low: 0, medium: 1, high: 2 };

export async function runBrandCheck(input: BrandCheckInput): Promise<BrandCheckResult> {
  const website = input.website || undefined;
  const instagram = input.instagram || undefined;

  const flags = runRedFlags(input.message, input.brandName, website);
  const domain = website ? await checkDomain(website) : null;
  const ruleRisk = scoreRisk(flags, domain?.notes.length ?? 0);

  const ai = await getAiReview({ ...input, website, instagram, flags, domain });

  // AI can raise the risk level, but never lower what the rules found.
  const risk = ai && RISK_ORDER[ai.risk] > RISK_ORDER[ruleRisk] ? ai.risk : ruleRisk;

  return {
    risk,
    flags,
    domain,
    aiReasons: ai?.reasons ?? [],
    questions: ai?.questions_to_ask_brand.length ? ai.questions_to_ask_brand : DEFAULT_QUESTIONS,
    aiError: ai ? null : "Showing rule-based results only (AI check not available right now).",
  };
}
