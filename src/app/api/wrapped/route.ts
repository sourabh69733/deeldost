// POST: make (or remake) the signed-in creator's Wrapped from their Instagram.
import { NextResponse } from "next/server";
import { InstagramApiError } from "@/lib/instagram/api";
import { countEvent } from "@/lib/server/metrics";
import { allowKey } from "@/lib/server/rate-limit";
import { isSameOrigin } from "@/lib/server/same-origin";
import { getCurrentUser } from "@/lib/server/session";
import { syncWrapped } from "@/lib/wrapped/sync";

// Each run can make ~70 Instagram calls (media pages + one per reel); Instagram limits apps per user.
const RUNS_PER_HOUR = 3;

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (!(await allowKey("wrapped", user.uid, RUNS_PER_HOUR))) {
    return NextResponse.json({ error: "You've made a few already. Try again in an hour." }, { status: 429 });
  }

  try {
    const wrapped = await syncWrapped(user.uid);
    await countEvent("wrapped_generated");
    return NextResponse.json({ wrapped });
  } catch (e) {
    if (e instanceof InstagramApiError && e.needsReconnect) {
      return NextResponse.json({ error: "Instagram access expired. Please reconnect." }, { status: 409 });
    }
    console.error("[wrapped] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Couldn't reach Instagram. Try again later." }, { status: 502 });
  }
}
