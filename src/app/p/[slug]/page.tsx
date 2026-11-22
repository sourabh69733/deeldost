import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageVisit, RemovePageButton, TrackedLink } from "@/components/outreach/PersonalPageActions";
import { compact, inr } from "@/lib/format";
import { buildPublicPage } from "@/lib/outreach/page";
import { getPageOwner } from "@/lib/outreach/store";
import { PLATFORMS } from "@/lib/people/config";
import { getAdminUser } from "@/lib/server/admin";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const owner = await getPageOwner(params.slug);
  // Made for one person and shared by link only.
  const robots = { index: false, follow: false };
  if (!owner) return { title: "Page not found — DealDost", robots };
  const page = buildPublicPage(owner.person);
  const who = page.handle ? `@${page.handle}` : page.firstName;
  return {
    title: `For ${who} — DealDost`,
    description: page.rates ? "What brands should pay you, and a few tips. Free." : "Tips for getting paid brand deals. Free.",
    robots,
    ...(page.rates ? { openGraph: { images: [{ url: `/api/rate-card?${page.rates.imageQuery}`, width: 1080, height: 1350 }] } } : {}),
  };
}

export default async function PersonalPage({ params }: Params) {
  const owner = await getPageOwner(params.slug);
  if (!owner) notFound();
  const page = buildPublicPage(owner.person);
  // The admin checking the page shouldn't count as a visit.
  const track = !(await getAdminUser());
  const slug = params.slug;
  const who = page.handle ? `@${page.handle}` : page.name ?? page.firstName;

  return (
    <article className="max-w-2xl pt-6">
      <PageVisit slug={slug} track={track} />

      <p className="font-semibold" style={{ color: "var(--marigold-deep)" }}>Made for {who}</p>
      <h1 className="mt-1 text-4xl font-extrabold">Hi {page.firstName} 👋</h1>
      <p className="mt-3 text-lg">
        {page.rates
          ? "Here's roughly what brands should pay you, and a few tips for your size and niche."
          : "Here are a few tips for getting paid brand deals, for your size and niche."}
      </p>

      <dl className="mt-8 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border-2 p-3" style={{ borderColor: "var(--line)", background: "#fff" }}>
          <dt className="text-sm" style={{ color: "var(--muted)" }}>Followers</dt>
          <dd className="text-2xl font-extrabold">{page.followers != null ? compact(page.followers) : "–"}</dd>
        </div>
        <div className="rounded-xl border-2 p-3" style={{ borderColor: "var(--line)", background: "#fff" }}>
          <dt className="text-sm" style={{ color: "var(--muted)" }}>{page.platform === "youtube" ? "Videos" : "Posts"}</dt>
          <dd className="text-2xl font-extrabold">{page.posts != null ? compact(page.posts) : "–"}</dd>
        </div>
        <div className="rounded-xl border-2 p-3" style={{ borderColor: "var(--line)", background: "#fff" }}>
          <dt className="text-sm" style={{ color: "var(--muted)" }}>Niche</dt>
          <dd className="text-xl font-extrabold leading-8">{page.nicheLabel}</dd>
        </div>
      </dl>
      {page.themes.length > 0 && (
        <p className="mt-3">
          <span className="hint">What you post: </span>{page.themes.join(", ")}
        </p>
      )}

      {page.rates && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">What brands should pay you</h2>
          <div className="tag mt-4">
            {page.rates.rows.map((r) => (
              <p key={r.label} className="flex justify-between gap-4 py-1 text-lg font-semibold">
                <span>{r.label}</span><span>{inr(r.price)}</span>
              </p>
            ))}
          </div>
          <p className="hint mt-3">
            A starting point, based on about {page.rates.assumedViews.toLocaleString("en-IN")} views per post, which is typical
            for your size. Your real views could be higher. Rates exclude GST; ask for 50% before you post.
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Tips for you</h2>
        <ul className="mt-3 space-y-3">
          {page.tips.map((t) => (
            <li key={t} className="rounded-xl border-2 p-4" style={{ borderColor: "var(--line)", background: "#fff" }}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl p-6" style={{ background: "var(--ink)", color: "#fff" }}>
        <h2 className="text-2xl font-bold">Get your exact numbers, free</h2>
        <p className="mt-2 opacity-90">
          Connect {PLATFORMS.instagram} to get a rate card from your real views and a media kit link to send brands.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <TrackedLink slug={slug} track={track} href="/account" className="btn justify-center" style={{ background: "var(--marigold)", color: "var(--ink)" }}>
            Make my free media kit
          </TrackedLink>
          <TrackedLink slug={slug} track={track} href="/check" className="btn justify-center" style={{ background: "transparent", border: "1.5px solid #fff" }}>
            Check a brand offer
          </TrackedLink>
        </div>
      </section>

      <p className="hint mt-10 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        Made by DealDost from your public profile. Only people with this link can see it. Not useful?{" "}
        <RemovePageButton slug={slug} />
      </p>
    </article>
  );
}
