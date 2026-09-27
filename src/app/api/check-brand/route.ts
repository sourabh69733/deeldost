import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { BrandCheckError, BrandCheckInput, runBrandCheck } from "@/lib/brand-check";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";
import { allowRequest } from "@/lib/server/rate-limit";
import { countEvent } from "@/lib/server/metrics";

// Each check can call Claude up to twice, so cap it per visitor.
const CHECKS_PER_HOUR = 10;

export async function POST(req: Request) {
  const parsed = BrandCheckInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (!(await allowRequest("check-brand", req, CHECKS_PER_HOUR))) {
    await countEvent("check_limited");
    return NextResponse.json(
      { error: `You've done ${CHECKS_PER_HOUR} checks this hour. Please try again in a little while.` },
      { status: 429 },
    );
  }

  let result;
  try {
    result = await runBrandCheck(parsed.data);
  } catch (e) {
    if (e instanceof BrandCheckError) return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }

  await countEvent(parsed.data.screenshot ? "check_screenshot" : "check_run");

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
