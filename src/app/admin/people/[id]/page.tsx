import Link from "next/link";
import { notFound } from "next/navigation";
import PersonEditor from "@/components/admin/PersonEditor";
import ResearchButton from "@/components/admin/ResearchButton";
import ResearchNote from "@/components/admin/ResearchNote";
import { compact, shortDate } from "@/lib/format";
import { PLATFORMS } from "@/lib/people/config";
import { displayHandle } from "@/lib/people/list";
import { getPerson } from "@/lib/people/store";
import { getAdminUser } from "@/lib/server/admin";

export default async function PersonPage({ params }: { params: { id: string } }) {
  const admin = await getAdminUser();
  if (!admin) notFound();
  const p = await getPerson(admin.uid, decodeURIComponent(params.id));
  if (!p) notFound();

  const stats = [["Followers", p.followers], ["Following", p.following], [p.platform === "youtube" ? "Videos" : "Posts", p.posts]] as const;

  return (
    <section className="pt-6">
      <Link href="/admin" className="text-sm font-semibold underline">← All people</Link>
      <h1 className="mt-3 break-words text-3xl font-extrabold sm:text-4xl">{p.name ?? displayHandle(p)}</h1>
      <p className="mt-1" style={{ color: "var(--muted)" }}>
        {PLATFORMS[p.platform]} · <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline">{displayHandle(p)}</a>
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-xl border-2 p-5" style={{ borderColor: "var(--line)", background: "#fff" }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Research</h2>
              <ResearchButton id={p.id} again={!!p.research} />
            </div>
            {p.research
              ? <ResearchNote r={p.research} />
              : <p className="hint">Reads their bio, posts and public links, then writes a short note: niche, themes, audience, a rate guess and a pitch idea.</p>}
          </section>

          {p.platform !== "website" && (
            <dl className="grid grid-cols-3 gap-3">
              {stats.map(([label, n]) => (
                <div key={label} className="rounded-xl border-2 p-3" style={{ borderColor: "var(--line)", background: "#fff" }}>
                  <dt className="text-sm" style={{ color: "var(--muted)" }}>{label}</dt>
                  <dd className="text-2xl font-extrabold">{n != null ? compact(n) : "–"}</dd>
                </div>
              ))}
            </dl>
          )}

          <div>
            <h2 className="text-lg font-bold">Bio</h2>
            <p className="mt-1 whitespace-pre-line">{p.bio ?? <span style={{ color: "var(--muted)" }}>Not captured yet. Open their profile and save it with the extension.</span>}</p>
          </div>

          {p.links.length > 0 && (
            <div>
              <h2 className="text-lg font-bold">Links</h2>
              <ul className="mt-1 space-y-1">
                {p.links.map((l) => <li key={l}><a href={l} target="_blank" rel="noopener noreferrer" className="break-all underline">{l}</a></li>)}
              </ul>
            </div>
          )}

          {p.recentPosts.length > 0 && (
            <div>
              <h2 className="text-lg font-bold">Recent posts</h2>
              <ul className="mt-2 space-y-2">
                {p.recentPosts.map((post) => (
                  <li key={post.url} className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--line)", background: "#fff" }}>
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Open</a>
                    {post.caption && <span className="ml-2" style={{ color: "var(--muted)" }}>{post.caption}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="hint">
            Saved {shortDate(p.createdAt)} by {p.source === "extension" ? "extension" : "link"}
            {p.capturedAt ? `, page last read ${shortDate(p.capturedAt)}` : ""}.
          </p>
        </div>

        <aside className="rounded-xl border-2 p-5" style={{ borderColor: "var(--line)", background: "#fff" }}>
          <PersonEditor id={p.id} status={p.status} notes={p.notes} />
        </aside>
      </div>
    </section>
  );
}
