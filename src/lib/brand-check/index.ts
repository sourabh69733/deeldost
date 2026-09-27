// The full brand check: (screenshot -> text) -> rules -> domain -> AI -> one combined result.
// Rules and domain always run; AI only adds to them.
import "server-only";
import { checkDomain } from "./domain-check";
import { runRedFlags, scoreRisk, type Risk } from "./red-flags";
import { getAiReview } from "./ai-review";
import { readScreenshot } from "./read-screenshot";
import type { BrandCheckInput } from "./input";
import type { BrandCheckResult } from "./types";

export { BrandCheckInput } from "./input";
export type { BrandCheckResult } from "./types";

/** A problem the user can fix. The route returns its message as-is. */
export class BrandCheckError extends Error {}

const DEFAULT_QUESTIONS = [
  "Can you share your company website and official email?",
  "What is the exact payment amount and when will you pay?",
  "Can you send a written agreement before I start?",
];

const RISK_ORDER: Record<Risk, number> = { low: 0, medium: 1, high: 2 };

export async function runBrandCheck(input: BrandCheckInput): Promise<BrandCheckResult> {
  const website = input.website || undefined;
  const instagram = input.instagram || undefined;
  let { brandName, message } = input;
  let readFromScreenshot: string | null = null;

  if (input.screenshot) {
    const read = await readScreenshot(input.screenshot);
    if (!read) throw new BrandCheckError("We couldn't read the screenshot right now. Paste the message text instead.");
    if (!read.is_message || read.text.trim().length < 10) {
      throw new BrandCheckError("That doesn't look like a message. Upload a screenshot of the brand's DM or email.");
    }
    readFromScreenshot = read.text.trim();
    message = [readFromScreenshot, message].filter(Boolean).join("\n\n");
    brandName ||= read.brand_name || read.sender_handle || "Unknown brand";
  }

  const flags = runRedFlags(message, brandName, website);
  const domain = website ? await checkDomain(website) : null;
  const ruleRisk = scoreRisk(flags, domain?.notes.length ?? 0);

  const ai = await getAiReview({ brandName, message, website, instagram, flags, domain });

  // AI can raise the risk level, but never lower what the rules found.
  const risk = ai && RISK_ORDER[ai.risk] > RISK_ORDER[ruleRisk] ? ai.risk : ruleRisk;

  return {
    brandName,
    risk,
    flags,
    domain,
    aiReasons: ai?.reasons ?? [],
    questions: ai?.questions_to_ask_brand.length ? ai.questions_to_ask_brand : DEFAULT_QUESTIONS,
    aiError: ai ? null : "Showing rule-based results only (AI check not available right now).",
    readFromScreenshot,
  };
}
