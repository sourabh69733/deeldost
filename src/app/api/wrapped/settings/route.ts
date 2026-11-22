// POST: turn the signed-in creator's public Wrapped link on or off.
import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/server/same-origin";
import { getCurrentUser } from "@/lib/server/session";
import { WrappedSettings } from "@/lib/wrapped/settings";
import { getWrapped, saveWrappedSettings } from "@/lib/wrapped/store";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const parsed = WrappedSettings.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  if (parsed.data.public && !(await getWrapped(user.uid))) {
    return NextResponse.json({ error: "Make your Wrapped first." }, { status: 409 });
  }

  await saveWrappedSettings(user.uid, parsed.data);
  return NextResponse.json({ ok: true });
}
