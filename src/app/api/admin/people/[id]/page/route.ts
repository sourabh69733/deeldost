// POST: make the person's personal page (/p/<code>). DELETE: turn it off.
import { NextResponse } from "next/server";
import { createPage, deletePage } from "@/lib/outreach/store";
import { getAdminUser } from "@/lib/server/admin";
import { isSameOrigin } from "@/lib/server/same-origin";

type Ctx = { params: { id: string } };

async function guard(req: Request) {
  if (!isSameOrigin(req)) return { error: NextResponse.json({ error: "Bad origin" }, { status: 403 }) };
  const admin = await getAdminUser();
  if (!admin) return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  return { admin };
}

export async function POST(req: Request, { params }: Ctx) {
  const { admin, error } = await guard(req);
  if (!admin) return error;
  const result = await createPage(admin.uid, params.id);
  if (!result.ok) {
    return result.reason === "opted_out"
      ? NextResponse.json({ error: "They removed their page before. Don't make another." }, { status: 409 })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ slug: result.person.page!.slug });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { admin, error } = await guard(req);
  if (!admin) return error;
  await deletePage(admin.uid, params.id);
  return NextResponse.json({ ok: true });
}
