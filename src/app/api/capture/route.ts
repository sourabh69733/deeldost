// POST: the browser extension saves the profile on the current page. Auth is the admin's extension key
// (Authorization: Bearer dd_...), not the login cookie, so there is no same-origin check.
import { NextResponse } from "next/server";
import { CAPTURES_PER_HOUR } from "@/lib/people/config";
import { CapturePayload, extractProfile } from "@/lib/people/extract";
import { saveProfile } from "@/lib/people/store";
import { bearerToken, verifyCaptureToken } from "@/lib/people/tokens";
import { allowKey } from "@/lib/server/rate-limit";

export async function POST(req: Request) {
  const token = bearerToken(req);
  const admin = token ? await verifyCaptureToken(token) : null;
  if (!admin) return NextResponse.json({ error: "Extension key is missing or old. Make a new one in the dashboard." }, { status: 401 });
  if (!(await allowKey("capture", admin.uid, CAPTURES_PER_HOUR))) {
    return NextResponse.json({ error: "Too many saves this hour. Try again later." }, { status: 429 });
  }

  const parsed = CapturePayload.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Couldn't read this page." }, { status: 400 });
  const profile = extractProfile(parsed.data);
  if (!profile) return NextResponse.json({ error: "This page isn't a profile. Open someone's profile or website." }, { status: 400 });

  const { person, created } = await saveProfile(admin.uid, profile, { source: "extension", notes: parsed.data.notes });
  return NextResponse.json({
    id: person.id,
    created,
    person: { name: person.name, handle: person.handle, platform: person.platform, followers: person.followers, status: person.status },
  });
}
