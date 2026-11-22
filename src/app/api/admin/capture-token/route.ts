// POST: make a new extension key for the signed-in admin. The old key stops working.
import { NextResponse } from "next/server";
import { createCaptureToken } from "@/lib/people/tokens";
import { getAdminUser } from "@/lib/server/admin";
import { isSameOrigin } from "@/lib/server/same-origin";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  return NextResponse.json({ token: await createCaptureToken(admin) });
}
