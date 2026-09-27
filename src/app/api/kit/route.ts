// POST: save the signed-in creator's media kit settings (public on/off, niche).
import { NextResponse } from "next/server";
import { getStats, getSummary } from "@/lib/instagram/store";
import { saveKitSettings } from "@/lib/kit/store";
import { KitSettings } from "@/lib/kit/settings";
import { isSameOrigin } from "@/lib/server/same-origin";
import { getCurrentUser } from "@/lib/server/session";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const parsed = KitSettings.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings" }, { status: 400 });

  if (parsed.data.public) {
    const [summary, stats] = await Promise.all([getSummary(user.uid), getStats(user.uid)]);
    if (!summary || !stats?.avgViews) {
      return NextResponse.json({ error: "Connect Instagram and refresh your numbers first." }, { status: 409 });
    }
  }

  await saveKitSettings(user.uid, parsed.data);
  return NextResponse.json({ ok: true });
}
