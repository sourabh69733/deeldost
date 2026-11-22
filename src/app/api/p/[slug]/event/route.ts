// POST { type: "view" | "click" }: counts a visit or a button click on a personal page.
// Always 204 so the page never shows an error for this.
import { z } from "zod";
import { PAGE_EVENTS_PER_HOUR } from "@/lib/outreach/config";
import { recordPageEvent } from "@/lib/outreach/store";
import { allowRequest } from "@/lib/server/rate-limit";

const Input = z.object({ type: z.enum(["view", "click"]) });

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const parsed = Input.safeParse(await req.json().catch(() => ({})));
  if (parsed.success && (await allowRequest("page_event", req, PAGE_EVENTS_PER_HOUR))) {
    await recordPageEvent(params.slug, parsed.data.type).catch((e) => console.warn("[page-event]", e instanceof Error ? e.message : e));
  }
  return new Response(null, { status: 204 });
}
