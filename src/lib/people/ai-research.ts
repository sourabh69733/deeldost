// Claude's research note on a saved creator, via Vertex AI. Returns null when AI is off or fails;
// research still works from rules alone.
import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NICHES, type Niche } from "@/lib/pricing/config";
import { CLAUDE_MODEL, getClaude } from "@/lib/server/gcp";

export const AiResearch = z.object({
  niche: z.enum(Object.keys(NICHES) as [Niche, ...Niche[]]),
  themes: z.array(z.string()),
  summary: z.string(),
  audience: z.string().nullable(),
  location: z.string().nullable(),
  languages: z.array(z.string()),
  brands: z.array(z.string()),
  pitch: z.string(),
});
export type AiResearch = z.infer<typeof AiResearch>;

const SYSTEM_PROMPT =
  "You research Indian social media creators for DealDost, a free tool that helps creators price brand deals, " +
  "spot fake brand offers, and make a media kit. From the public profile data given, write a short research note " +
  "in simple English. Use only the data given. Use null or an empty list when something is not shown. " +
  "Never guess or mention age, religion, caste, health, relationships or other sensitive personal details. " +
  "niche: the best fit from the allowed list. themes: 2 to 5 short content themes. summary: 2 sentences on what they " +
  "post and their style. audience: who likely watches, in a few words. location: city or region only if stated. " +
  "languages: languages used in captions. brands: brands they have clearly worked with or tagged. " +
  "pitch: one friendly sentence on how DealDost could help this creator specifically.";

export type AiResearchInput = {
  platform: string;
  handle: string | null;
  name: string | null;
  bio: string | null;
  followers: number | null;
  posts: number | null;
  captions: string[];
  hashtags: string[];
  ruleNiche: Niche;
  pages: { url: string; title: string | null; description: string | null; text: string }[];
};

export async function getAiResearch(input: AiResearchInput): Promise<AiResearch | null> {
  const claude = getClaude();
  if (!claude) return null;
  try {
    const res = await claude.messages.parse(
      {
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        output_config: { format: zodOutputFormat(AiResearch) },
        messages: [{ role: "user", content: JSON.stringify(input) }],
      },
      { timeout: 40_000, maxRetries: 1 },
    );
    const out = res.parsed_output;
    if (!out) return null;
    const short = (a: string[], n: number) => a.map((s) => s.trim()).filter(Boolean).slice(0, n).map((s) => s.slice(0, 80));
    return {
      ...out,
      themes: short(out.themes, 5),
      languages: short(out.languages, 4),
      brands: short(out.brands, 10),
      summary: out.summary.slice(0, 600),
      pitch: out.pitch.slice(0, 300),
      audience: out.audience?.slice(0, 200) ?? null,
      location: out.location?.slice(0, 100) ?? null,
    };
  } catch (e) {
    console.error("[ai-research] failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
