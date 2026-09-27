// POST: pull fresh numbers from Instagram for the signed-in user.
import { NextResponse } from "next/server";
import { InstagramApiError } from "@/lib/instagram/api";
import { syncStats } from "@/lib/instagram/sync";
import { allowKey } from "@/lib/server/rate-limit";
import { isSameOrigin } from "@/lib/server/same-origin";
import { getCurrentUser } from "@/lib/server/session";

// Each refresh makes ~20 Instagram API calls; Instagram rate-limits apps per user.
const REFRESHES_PER_HOUR = 4;

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (!(await allowKey("ig-refresh", user.uid, REFRESHES_PER_HOUR))) {
    return NextResponse.json({ error: "You've refreshed a few times already. Try again in an hour." }, { status: 429 });
  }

  try {
    return NextResponse.json({ stats: await syncStats(user.uid) });
  } catch (e) {
    if (e instanceof InstagramApiError && e.needsReconnect) {
      return NextResponse.json({ error: "Instagram access expired. Please reconnect." }, { status: 409 });
    }
    console.error("[instagram/refresh] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't reach Instagram. Try again later." }, { status: 502 });
  }
}
