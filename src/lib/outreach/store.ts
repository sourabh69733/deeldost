// Personal pages in Firestore:
//   personalPages/{slug}              { uid, personId, createdAt } maps a public link to the saved person
//   users/{uid}/people/{id}.page      { slug, createdAt, views, clicks, lastViewAt, signedUpAt }
import "server-only";
import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";
import { addNotes, type Person, type PersonPage } from "@/lib/people/person";
import { shortDate } from "@/lib/format";
import { looksLikeSlug } from "./slug";

function db() {
  const d = getDb();
  if (!d) throw new Error("Firestore is not configured");
  return d;
}
const personRef = (uid: string, id: string) => db().collection(COLLECTIONS.users).doc(uid).collection("people").doc(id);
const pageRef = (slug: string) => db().collection(COLLECTIONS.personalPages).doc(slug);

type PageLink = { uid: string; personId: string };

async function linkFor(slug: string): Promise<PageLink | null> {
  if (!looksLikeSlug(slug)) return null;
  const snap = await pageRef(slug).get();
  return snap.exists ? (snap.data() as PageLink) : null;
}

export type CreatePageResult = { ok: true; person: Person } | { ok: false; reason: "not_found" | "opted_out" };

/** Makes (or keeps) the person's page. A person at Saved or Researched moves to Page ready. */
export async function createPage(uid: string, id: string): Promise<CreatePageResult> {
  const ref = personRef(uid, id);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { ok: false, reason: "not_found" } as const;
    const person = snap.data() as Person;
    if (person.optedOut) return { ok: false, reason: "opted_out" } as const;
    if (person.page) return { ok: true, person } as const;

    const now = Date.now();
    const page: PersonPage = { slug: randomBytes(9).toString("base64url"), createdAt: now, views: 0, clicks: 0, lastViewAt: null, signedUpAt: null };
    const status = person.status === "saved" || person.status === "researched" ? "page_ready" : person.status;
    const next: Person = { ...person, page, status, updatedAt: now };
    tx.set(pageRef(page.slug), { uid, personId: id, createdAt: now });
    tx.set(ref, next);
    return { ok: true, person: next } as const;
  });
}

/** Admin turns the page off: the link stops working. */
export async function deletePage(uid: string, id: string): Promise<void> {
  const ref = personRef(uid, id);
  const person = (await ref.get()).data() as Person | undefined;
  if (!person?.page) return;
  const batch = db().batch();
  batch.delete(pageRef(person.page.slug));
  batch.set(ref, { ...person, page: null, updatedAt: Date.now() });
  await batch.commit();
}

/** The person behind a public page link, or null if the link is off or unknown. */
export async function getPageOwner(slug: string): Promise<{ uid: string; person: Person } | null> {
  const link = await linkFor(slug);
  if (!link) return null;
  const person = (await personRef(link.uid, link.personId).get()).data() as Person | undefined;
  return person?.page?.slug === slug ? { uid: link.uid, person } : null;
}

/** Counts a page view or a button click. */
export async function recordPageEvent(slug: string, type: "view" | "click"): Promise<void> {
  const link = await linkFor(slug);
  if (!link) return;
  const ref = personRef(link.uid, link.personId);
  const update = type === "view"
    ? { "page.views": FieldValue.increment(1), "page.lastViewAt": Date.now() }
    : { "page.clicks": FieldValue.increment(1) };
  await ref.update(update).catch(() => {}); // person deleted meanwhile
}

/** The creator signed up after visiting their page. */
export async function markSignedUp(slug: string): Promise<void> {
  const link = await linkFor(slug);
  if (!link) return;
  const ref = personRef(link.uid, link.personId);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const person = snap.data() as Person | undefined;
    if (!person?.page || person.page.signedUpAt) return;
    const now = Date.now();
    tx.set(ref, { ...person, status: "signed_up", page: { ...person.page, signedUpAt: now }, updatedAt: now });
  });
}

/** The creator removed their page: delete the link, remember not to make another, and stop outreach. */
export async function optOut(slug: string): Promise<boolean> {
  const link = await linkFor(slug);
  if (!link) return false;
  const ref = personRef(link.uid, link.personId);
  const person = (await ref.get()).data() as Person | undefined;
  const batch = db().batch();
  batch.delete(pageRef(slug));
  if (person) {
    const now = Date.now();
    batch.set(ref, {
      ...person, page: null, optedOut: true, status: "dropped", updatedAt: now,
      notes: addNotes(person.notes, `They removed their page on ${shortDate(now)}. Don't contact again.`),
    });
  }
  await batch.commit();
  return true;
}
