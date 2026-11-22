// POST: the creator removes their personal page. Anyone with the link can do this; that is on purpose.
import { NextResponse } from "next/server";
import { optOut } from "@/lib/outreach/store";
import { isSameOrigin } from "@/lib/server/same-origin";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  await optOut(params.slug);
  // Same answer whether or not the page existed, so links can't be probed.
  return NextResponse.json({ ok: true });
}
