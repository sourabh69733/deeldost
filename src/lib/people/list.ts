// Dashboard list helpers: filter by status and search text, and count people per status.
import { STATUS_KEYS, type Status } from "./config";
import type { Person } from "./person";

export const isStatus = (s: string | undefined): s is Status => !!s && (STATUS_KEYS as string[]).includes(s);

export function filterPeople(people: Person[], opts: { status?: Status; q?: string }): Person[] {
  const q = (opts.q ?? "").trim().toLowerCase().replace(/^@/, "");
  return people.filter((p) =>
    (!opts.status || p.status === opts.status) &&
    (!q || [p.name, p.handle, p.url, p.bio, p.notes].some((v) => v?.toLowerCase().includes(q))));
}

export function countByStatus(people: Person[]): Record<Status, number> {
  const counts = Object.fromEntries(STATUS_KEYS.map((s) => [s, 0])) as Record<Status, number>;
  for (const p of people) counts[p.status] += 1;
  return counts;
}

/** "@handle" for social profiles, the host for websites. */
export function displayHandle(p: Pick<Person, "platform" | "handle" | "url">): string {
  if (p.handle && p.platform !== "linkedin") return `@${p.handle}`;
  try {
    const u = new URL(p.url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return p.url;
  }
}
