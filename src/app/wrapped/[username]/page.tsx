import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import WrappedLauncher from "@/components/wrapped/WrappedLauncher";
import { wrappedCardPath } from "@/lib/wrapped/settings";
import { getPublicWrapped } from "@/lib/wrapped/store";

type Params = { params: { username: string } };

const normalise = (u: string) => decodeURIComponent(u).toLowerCase();

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = await getPublicWrapped(normalise(params.username)).catch(() => null);
  if (!p) return { title: "Wrapped — DealDost", robots: { index: false } };
  const { username, year } = p.wrapped;
  return {
    title: `@${username}'s ${year} Wrapped — DealDost`,
    description: `See @${username}'s year on Instagram, then make your own.`,
    // Shared by link; kept out of search results.
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: wrappedCardPath(username), width: 1080, height: 1920 }] },
  };
}

export default async function PublicWrappedPage({ params }: Params) {
  const p = await getPublicWrapped(normalise(params.username)).catch(() => null);
  if (!p) notFound();
  const { username, year } = p.wrapped;

  return (
    <section className="pt-6">
      <h1 className="text-4xl font-extrabold">@{username}&apos;s {year}, Wrapped</h1>
      <p className="mt-2 mb-6" style={{ color: "var(--muted)" }}>Their year on Instagram, in one story.</p>
      <WrappedLauncher wrapped={p.wrapped} picture={p.picture} mode="public" cardUrl={wrappedCardPath(username)} autoOpen />

      <div className="mt-10 rounded-2xl p-6" style={{ background: "var(--marigold)" }}>
        <h2 className="text-2xl font-bold">Want yours?</h2>
        <p className="mt-1">Free for Instagram creators. Takes a minute.</p>
        <Link href="/wrapped#make" className="btn mt-4">Make my Wrapped</Link>
      </div>
    </section>
  );
}
