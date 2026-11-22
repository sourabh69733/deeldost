// POST: trade a fresh Firebase ID token for a session cookie (sign in).
// DELETE: clear the session cookie (sign out).
import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { markSignedUp } from "@/lib/outreach/store";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";
import { isSameOrigin } from "@/lib/server/same-origin";
import { SESSION_COOKIE, createSessionCookie } from "@/lib/server/session";

// ref: personal page code, if they came from their page (see src/lib/outreach). Marks them as signed up.
const Input = z.object({ idToken: z.string().min(100).max(5000), ref: z.string().regex(/^[A-Za-z0-9_-]{12}$/).optional() });

const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const parsed = Input.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid sign-in" }, { status: 400 });

  const session = await createSessionCookie(parsed.data.idToken);
  if (!session) return NextResponse.json({ error: "Sign-in failed. Please try again." }, { status: 401 });

  // Keep a profile doc; createdAt is only written the first time.
  const db = getDb();
  if (db) {
    const ref = db.collection(COLLECTIONS.users).doc(session.user.uid);
    const exists = (await ref.get()).exists;
    await ref.set({
      name: session.user.name,
      email: session.user.email,
      picture: session.user.picture,
      lastLoginAt: FieldValue.serverTimestamp(),
      ...(exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    }, { merge: true });
  }

  if (parsed.data.ref) {
    await markSignedUp(parsed.data.ref).catch((e) => console.warn("[session] ref failed:", e instanceof Error ? e.message : e));
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, session.cookie, { ...cookieOptions, maxAge: session.maxAge });
  return res;
}

export async function DELETE(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
