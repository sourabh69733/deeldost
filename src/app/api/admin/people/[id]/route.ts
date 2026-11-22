// PATCH: change a person's status or notes. DELETE: remove them.
import { NextResponse } from "next/server";
import { z } from "zod";
import { LIMITS, STATUS_KEYS, type Status } from "@/lib/people/config";
import { deletePerson, updatePerson } from "@/lib/people/store";
import { getAdminUser } from "@/lib/server/admin";
import { isSameOrigin } from "@/lib/server/same-origin";

const Patch = z.object({
  status: z.enum(STATUS_KEYS as [Status, ...Status[]]).optional(),
  notes: z.string().max(LIMITS.notes).optional(),
}).strict();

type Ctx = { params: { id: string } };

async function guard(req: Request) {
  if (!isSameOrigin(req)) return { error: NextResponse.json({ error: "Bad origin" }, { status: 403 }) };
  const admin = await getAdminUser();
  if (!admin) return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  return { admin };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { admin, error } = await guard(req);
  if (!admin) return error;
  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid change" }, { status: 400 });
  const person = await updatePerson(admin.uid, params.id, parsed.data);
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ person });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { admin, error } = await guard(req);
  if (!admin) return error;
  await deletePerson(admin.uid, params.id);
  return NextResponse.json({ ok: true });
}
