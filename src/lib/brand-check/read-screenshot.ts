// Reads a DM or email screenshot with Claude and returns the text in it.
// The image is never stored.
import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CLAUDE_MODEL, getClaude } from "@/lib/server/gcp";
import type { Screenshot } from "./input";

const ScreenshotText = z.object({
  is_message: z.boolean(),
  text: z.string(),
  brand_name: z.string().nullable(),
  sender_handle: z.string().nullable(),
});
export type ScreenshotText = z.infer<typeof ScreenshotText>;

const PROMPT =
  "This is a screenshot a creator received, usually an Instagram DM, WhatsApp chat or email from a brand. " +
  "Set is_message to false if it is not a message or chat. " +
  "In text, copy the brand's messages word for word, including emails, links, handles and amounts. Skip the creator's own replies. " +
  "Set brand_name to the brand the sender claims to represent, and sender_handle to their @handle or email, or null if not visible.";

/** Returns null when AI is not configured or the call fails. */
export async function readScreenshot(shot: Screenshot): Promise<ScreenshotText | null> {
  const claude = getClaude();
  if (!claude) return null;

  try {
    const res = await claude.messages.parse(
      {
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        output_config: { format: zodOutputFormat(ScreenshotText) },
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: shot.mediaType, data: shot.data } },
            { type: "text", text: PROMPT },
          ],
        }],
      },
      { timeout: 30_000, maxRetries: 1 },
    );
    return res.parsed_output ?? null;
  } catch (e) {
    console.error("[read-screenshot] failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
