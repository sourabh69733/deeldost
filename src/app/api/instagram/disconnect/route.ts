// POST: disconnect Instagram and delete the stored token and stats.
import { NextResponse } from "next/server";
import { disconnect } from "@/lib/instagram/store";
import { isSameOrigin } from "@/lib/server/same-origin";
import { getCurrentUser } from "@/lib/server/session";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  await disconnect(user.uid);
  return NextResponse.json({ ok: true });
}
