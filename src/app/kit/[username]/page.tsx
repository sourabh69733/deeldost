import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MediaKit from "@/components/MediaKit";
import { getPublicKit } from "@/lib/kit/store";
import { rateCardQuery } from "@/lib/pricing/rate-card";

type Params = { params: { username: string } };

const normalise = (u: string) => decodeURIComponent(u).toLowerCase();

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const kit = await getPublicKit(normalise(params.username));
  if (!kit) return { title: "Media kit — DealDost", robots: { index: false } };
  const image = `/api/rate-card?${rateCardQuery({
    platform: "instagram", followers: kit.stats.followers, avgViews: kit.stats.avgViews!, niche: kit.settings.niche, handle: kit.summary.username,
  })}`;
  return {
    title: `@${kit.summary.username} media kit — DealDost`,
    description: `Audience, reach and rates for @${kit.summary.username}.`,
    // Shared by link with brands; kept out of search results.
    robots: { index: false, follow: false },
    openGraph: { images: [{ url: image, width: 1080, height: 1350 }] },
  };
}

export default async function KitPage({ params }: Params) {
  const kit = await getPublicKit(normalise(params.username));
  if (!kit) notFound();
  return <MediaKit kit={kit} />;
}
