import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { calculateRate } from "@/lib/pricing/calculate";
import { DELIVERABLES } from "@/lib/pricing/config";
import { DealReportInput } from "@/lib/pricing/deal-report";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";
import { allowRequest } from "@/lib/server/rate-limit";
import { countEvent } from "@/lib/server/metrics";

const REPORTS_PER_HOUR = 5;

export async function POST(req: Request) {
  const parsed = DealReportInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  if (!(await allowRequest("deal-report", req, REPORTS_PER_HOUR))) {
    return NextResponse.json({ error: "Thanks! You've sent a few reports already. Try again later." }, { status: 429 });
  }

  const report = parsed.data;
  // Our estimate is computed here, not trusted from the browser.
  const fair = calculateRate(report).fair;
  const ratio = Math.round((report.paid / fair) * 100) / 100;

  const db = getDb();
  if (!db) {
    console.log("[deal-report] GCP not configured:", { ...report, fair, ratio });
  } else {
    try {
      await db.collection(COLLECTIONS.dealReports).add({
        ...report,
        platform: DELIVERABLES[report.deliverable].platform,
        fairAtTime: fair,
        ratio,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error("[deal-report] save failed:", e instanceof Error ? e.message : e);
      return NextResponse.json({ error: "Could not save your report. Try again." }, { status: 500 });
    }
  }

  await countEvent("deal_report");
  return NextResponse.json({ ok: true, fair, ratio });
}
