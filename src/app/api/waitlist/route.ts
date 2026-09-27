import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";
import { countEvent } from "@/lib/server/metrics";

const Input = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email") });

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { email } = parsed.data;

  const db = getDb();
  if (!db) {
    console.log("[waitlist] GCP not configured, email:", email);
    return NextResponse.json({ ok: true });
  }

  try {
    // Email is the doc id, so joining twice is harmless.
    await db.collection(COLLECTIONS.waitlist).doc(email).set(
      { email, createdAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    await countEvent("waitlist_join");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[waitlist] save failed", e);
    return NextResponse.json({ error: "Could not save your email. Try again." }, { status: 500 });
  }
}
