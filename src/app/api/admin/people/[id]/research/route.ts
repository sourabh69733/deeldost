// POST: run research on one saved person (their public links + Claude) and save the note.
import { NextResponse } from "next/server";
import { getAiResearch } from "@/lib/people/ai-research";
import { RESEARCH_PER_HOUR } from "@/lib/people/config";
import { runResearch } from "@/lib/people/research";
import { getPerson, saveResearch } from "@/lib/people/store";
import { getAdminUser } from "@/lib/server/admin";
import { allowKey } from "@/lib/server/rate-limit";
import { fetchPublicPage } from "@/lib/server/safe-fetch";
import { isSameOrigin } from "@/lib/server/same-origin";

// Page fetches (8s each, in parallel) plus one Claude call (up to 40s, one retry).
export const maxDuration = 90;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const person = await getPerson(admin.uid, params.id);
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await allowKey("research", admin.uid, RESEARCH_PER_HOUR))) {
    return NextResponse.json({ error: "Research limit reached for this hour. Try again later." }, { status: 429 });
  }

  const research = await runResearch(person, { fetchPage: fetchPublicPage, ai: getAiResearch });
  const saved = await saveResearch(admin.uid, person.id, research);
  if (!saved) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ research });
}
