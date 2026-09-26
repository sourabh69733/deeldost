// Claude's second opinion on a brand offer, via Vertex AI.
// Returns null when AI is not configured or fails. Callers must not depend on it.
import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CLAUDE_MODEL, getClaude } from "@/lib/server/gcp";
import type { DomainResult } from "./domain-check";
import type { Flag } from "./red-flags";

const AiReview = z.object({
  risk: z.enum(["low", "medium", "high"]),
  reasons: z.array(z.string()),
  questions_to_ask_brand: z.array(z.string()),
});
export type AiReview = z.infer<typeof AiReview>;

const SYSTEM_PROMPT =
  "You help Indian social media creators judge whether a brand collaboration offer is genuine. " +
  "Be practical and plain-spoken, in simple English. Never claim certainty; talk about signals, not proof. " +
  "Give 2-5 short reasons and 3-4 short questions the creator should ask the brand before agreeing.";

export type AiReviewInput = {
  brandName: string;
  website?: string;
  instagram?: string;
  message: string;
  flags: Flag[];
  domain: DomainResult | null;
};

export async function getAiReview(input: AiReviewInput): Promise<AiReview | null> {
  const claude = getClaude();
  if (!claude) return null;

  try {
    const res = await claude.messages.parse(
      {
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        output_config: { format: zodOutputFormat(AiReview) },
        messages: [{
          role: "user",
          content: JSON.stringify({
            brand_name: input.brandName,
            website: input.website ?? null,
            instagram: input.instagram ?? null,
            message: input.message,
            rule_flags: input.flags.map((f) => f.reason),
            domain_check: input.domain,
          }),
        }],
      },
      // Keep the user waiting at most ~20s; rule results are shown either way.
      { timeout: 20_000, maxRetries: 1 },
    );
    return res.parsed_output ?? null;
  } catch (e) {
    console.error("[ai-review] failed", e);
    return null;
  }
}
