import Link from "next/link";
import { notFound } from "next/navigation";
import { SignInButton } from "@/components/AuthButtons";
import AddPersonForm from "@/components/admin/AddPersonForm";
import ExtensionKey from "@/components/admin/ExtensionKey";
import { compact, shortDate } from "@/lib/format";
import { PLATFORMS, STATUSES, STATUS_KEYS } from "@/lib/people/config";
import { NICHES } from "@/lib/pricing/config";
import { countByStatus, displayHandle, filterPeople, isStatus } from "@/lib/people/list";
import { listPeople } from "@/lib/people/store";
import { getAdminUser } from "@/lib/server/admin";
import { getCurrentUser } from "@/lib/server/session";

type Props = { searchParams: { status?: string; q?: string } };

export default async function AdminPage({ searchParams }: Props) {
  const admin = await getAdminUser();
  if (!admin) {
    if (await getCurrentUser()) notFound();
    return (
      <section className="pt-6">
        <h1 className="text-4xl font-extrabold">Dashboard</h1>
        <p className="mt-3 mb-6" style={{ color: "var(--muted)" }}>Sign in with an admin account.</p>
        <SignInButton />
      </section>
    );
  }

  const status = isStatus(searchParams.status) ? searchParams.status : undefined;
  const q = searchParams.q?.slice(0, 100) ?? "";
  const all = await listPeople(admin.uid);
  const counts = countByStatus(all);
  const people = filterPeople(all, { status, q });
  const href = (s?: string) => `/admin?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(q ? { q } : {}) })}`;

  return (
    <section className="pt-6">
      <h1 className="text-4xl font-extrabold">People</h1>
      <p className="mt-2" style={{ color: "var(--muted)" }}>Creators you saved from the extension or by link.</p>

      <AddPersonForm />

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter by status">
        <Link href={href()} className="chip" aria-pressed={!status}>All {all.length}</Link>
        {STATUS_KEYS.filter((s) => counts[s] > 0 || s === status).map((s) => (
          <Link key={s} href={href(s)} className="chip" aria-pressed={status === s}>{STATUSES[s]} {counts[s]}</Link>
        ))}
      </nav>

      <form className="mt-3" action="/admin">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} className="field sm:max-w-sm" placeholder="Search name, handle, bio or notes" aria-label="Search" />
      </form>

      <ul className="mt-4 divide-y rounded-xl border-2" style={{ borderColor: "var(--line)", background: "#fff" }}>
        {people.length === 0 && (
          <li className="p-5" style={{ color: "var(--muted)" }}>{all.length ? "No one matches." : "No one saved yet. Paste a link above or use the extension."}</li>
        )}
        {people.map((p) => (
          <li key={p.id} style={{ borderColor: "var(--line)" }}>
            <Link href={`/admin/people/${p.id}`} className="flex items-center gap-3 p-4 hover:bg-[var(--paper)]">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name ?? displayHandle(p)}</p>
                <p className="truncate text-sm" style={{ color: "var(--muted)" }}>
                  {PLATFORMS[p.platform]} · {displayHandle(p)}{p.followers != null ? ` · ${compact(p.followers)} followers` : ""}
                  {p.research ? ` · ${NICHES[p.research.niche].label}` : ""}
                  {p.page ? ` · ${p.page.views} view${p.page.views === 1 ? "" : "s"}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "var(--paper)", border: "1.5px solid var(--line)" }}>{STATUSES[p.status]}</span>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{shortDate(p.updatedAt)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-xl border-2 p-6" style={{ borderColor: "var(--line)", background: "#fff" }}>
        <h2 className="text-xl font-bold">Browser extension</h2>
        <p className="mt-1">Save any profile in one click. Install the extension from the <code>extension</code> folder, then make a key here.</p>
        <ExtensionKey />
      </section>
    </section>
  );
}
