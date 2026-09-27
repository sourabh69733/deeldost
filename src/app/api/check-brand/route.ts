import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { BrandCheckError, BrandCheckInput, runBrandCheck } from "@/lib/brand-check";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";

export async function POST(req: Request) {
  const parsed = BrandCheckInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  let result;
  try {
    result = await runBrandCheck(parsed.data);
  } catch (e) {
    if (e instanceof BrandCheckError) return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }

  // Keep a light record for tuning rules. Never store the message or screenshot.
  const db = getDb();
  if (db) {
    await db.collection(COLLECTIONS.brandChecks).add({
      brandName: result.brandName,
      website: parsed.data.website || null,
      instagram: parsed.data.instagram || null,
      source: parsed.data.screenshot ? "screenshot" : "paste",
      risk: result.risk,
      flagIds: result.flags.map((f) => f.id),
      usedAi: result.aiError === null,
      createdAt: FieldValue.serverTimestamp(),
    }).catch((e) => console.error("[check-brand] save failed", e));
  }

  return NextResponse.json(result);
}
