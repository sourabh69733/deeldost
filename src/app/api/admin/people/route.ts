// POST: admin adds a person by pasting a link (the dashboard's "Add by link" form).
import { NextResponse } from "next/server";
import { z } from "zod";
import { LIMITS } from "@/lib/people/config";
import { profileFromUrl } from "@/lib/people/extract";
import { saveProfile } from "@/lib/people/store";
import { getAdminUser } from "@/lib/server/admin";
import { isSameOrigin } from "@/lib/server/same-origin";

const Body = z.object({ url: z.string().min(1).max(2000), notes: z.string().max(LIMITS.notes).optional() });

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Paste a link first." }, { status: 400 });
  const profile = profileFromUrl(parsed.data.url);
  if (!profile) return NextResponse.json({ error: "That isn't a profile or website link." }, { status: 400 });

  const { person, created } = await saveProfile(admin.uid, profile, { source: "link", notes: parsed.data.notes });
  return NextResponse.json({ id: person.id, created });
}
