import { compact, inr } from "@/lib/format";
import { NICHES } from "@/lib/pricing/config";
import { buildRateCard } from "@/lib/pricing/rate-card";
import type { PublicKit } from "@/lib/kit/store";
import { AudienceBreakdown, Stat } from "./StatBlocks";

// The media kit a creator sends to brands. Presentational only.
export default function MediaKit({ kit }: { kit: PublicKit }) {
  const { summary, stats, settings } = kit;
  const card = buildRateCard({ platform: "instagram", followers: stats.followers, avgViews: stats.avgViews!, niche: settings.niche });

  return (
    <article className="pt-6">
      <header className="flex items-center gap-4">
        {summary.picture && (
          // Instagram CDN URLs rotate, so a plain img is simpler than configuring next/image domains.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={summary.picture} alt="" width={72} height={72} referrerPolicy="no-referrer" className="h-[72px] w-[72px] rounded-full" />
        )}
        <div>
          <h1 className="text-4xl font-extrabold">@{summary.username}</h1>
          <p style={{ color: "var(--muted)" }}>{NICHES[settings.niche].label} creator on Instagram</p>
        </div>
      </header>

      <dl className="mt-8 grid grid-cols-3 gap-3 text-center">
        <Stat label="Followers" value={compact(stats.followers)} />
        <Stat label="Typical views" value={compact(stats.avgViews!)} />
        <Stat label="Engagement" value={stats.engagementRate !== null ? `${(stats.engagementRate * 100).toFixed(1)}%` : "–"} />
      </dl>
      <p className="hint mt-2">
        Live from Instagram, updated {new Date(stats.refreshedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.
        Typical views = middle value of the last {stats.reelsCounted} reels.
      </p>

      {stats.audience && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Audience</h2>
          <div className="mt-4"><AudienceBreakdown audience={stats.audience} /></div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Rates</h2>
        <div className="tag mt-4">
          {card.rows.map((r) => (
            <p key={r.deliverable} className="flex justify-between gap-4 py-1 text-lg font-semibold">
              <span>{r.label}</span><span>{inr(r.price)}</span>
            </p>
          ))}
        </div>
        <ul className="mt-4 space-y-1">
          {card.addOns.map((a) => (
            <li key={a.id} className="flex justify-between gap-4"><span>{a.label}</span><span className="font-semibold">+{a.percent}%</span></li>
          ))}
        </ul>
        <p className="hint mt-3">50% advance, 50% on posting. Rates exclude GST.</p>
      </section>

      <section className="mt-10 border-t pt-6" style={{ borderColor: "var(--line)" }}>
        <h2 className="text-xl font-bold">Work together</h2>
        <p className="mt-2">
          Message <a className="font-semibold underline" href={`https://instagram.com/${summary.username}`} rel="noopener noreferrer" target="_blank">@{summary.username}</a> on Instagram.
        </p>
      </section>
    </article>
  );
}

