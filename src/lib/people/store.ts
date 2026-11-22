// Where saved people live in Firestore (admin only):
//   users/{uid}/people/{personId}    Person: public profile fields, our notes and outreach status
import "server-only";
import { COLLECTIONS, getDb } from "@/lib/server/gcp";
import { LIMITS, type Status } from "./config";
import type { ExtractedProfile } from "./extract";
import { addNotes, mergeProfile, personId, type Person, type Source } from "./person";

function db() {
  const d = getDb();
  if (!d) throw new Error("Firestore is not configured");
  return d;
}
const peopleRef = (uid: string) => db().collection(COLLECTIONS.users).doc(uid).collection("people");

export async function listPeople(uid: string): Promise<Person[]> {
  const snap = await peopleRef(uid).orderBy("updatedAt", "desc").limit(LIMITS.list).get();
  return snap.docs.map((d) => d.data() as Person);
}

export async function getPerson(uid: string, id: string): Promise<Person | null> {
  if (!/^[a-z]+_[a-z0-9._-]{1,64}$/.test(id)) return null;
  const snap = await peopleRef(uid).doc(id).get();
  return snap.exists ? (snap.data() as Person) : null;
}

/** Saves a captured or pasted profile, merging into the existing person. */
export async function saveProfile(uid: string, profile: ExtractedProfile, opts: { source: Source; notes?: string }): Promise<{ person: Person; created: boolean }> {
  const ref = peopleRef(uid).doc(personId(profile));
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? (snap.data() as Person) : null;
    const person = mergeProfile(existing, profile, { ...opts, now: Date.now() });
    tx.set(ref, person);
    return { person, created: !existing };
  });
}

export type PersonPatch = { status?: Status; notes?: string; addNote?: string };

export async function updatePerson(uid: string, id: string, patch: PersonPatch): Promise<Person | null> {
  const person = await getPerson(uid, id);
  if (!person) return null;
  const next: Person = {
    ...person,
    status: patch.status ?? person.status,
    notes: addNotes(patch.notes ?? person.notes, patch.addNote),
    updatedAt: Date.now(),
  };
  await peopleRef(uid).doc(id).set(next);
  return next;
}

export async function deletePerson(uid: string, id: string): Promise<void> {
  if (await getPerson(uid, id)) await peopleRef(uid).doc(id).delete();
}
