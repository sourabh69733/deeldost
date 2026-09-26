import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { BrandCheckInput, runBrandCheck } from "@/lib/brand-check";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";

export async function POST(req: Request) {
  const parsed = BrandCheckInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const result = await runBrandCheck(parsed.data);

  // Keep a light record for tuning rules. Never store the pasted message itself.
  const db = getDb();
  if (db) {
    await db.collection(COLLECTIONS.brandChecks).add({
      brandName: parsed.data.brandName,
      website: parsed.data.website || null,
      instagram: parsed.data.instagram || null,
      risk: result.risk,
      flagIds: result.flags.map((f) => f.id),
      usedAi: result.aiError === null,
      createdAt: FieldValue.serverTimestamp(),
    }).catch((e) => console.error("[check-brand] save failed", e));
  }

  return NextResponse.json(result);
}
