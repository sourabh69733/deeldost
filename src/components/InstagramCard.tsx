import Link from "next/link";
import { compact } from "@/lib/format";
import type { InstagramStats } from "@/lib/instagram/stats";
import type { InstagramSummary } from "@/lib/instagram/store";
import InstagramActions from "./InstagramActions";
import { AudienceBreakdown, Stat } from "./StatBlocks";

// Messages for /account?ig=... after the connect flow.
const NOTICES: Record<string, { text: string; ok?: boolean }> = {
  connected: { text: "Instagram connected.", ok: true },
  cancelled: { text: "Connection cancelled. You can try again any time." },
  expired: { text: "That link expired. Please try connecting again." },
  taken: { text: "That Instagram account is already linked to another DealDost account." },
  unavailable: { text: "Instagram connection isn't available yet." },
  signin: { text: "Please sign in first." },
  error: { text: "Something went wrong connecting Instagram. Please try again." },
};

type Props = { configured: boolean; summary: InstagramSummary | null; stats: InstagramStats | null; notice?: string };

export default function InstagramCard({ configured, summary, stats, notice }: Props) {
  const n = notice ? NOTICES[notice] : undefined;

  return (
    <section className="mt-10 rounded-xl border-2 p-6" style={{ borderColor: "var(--line)", background: "#fff" }}>
      <h2 className="text-xl font-bold">Instagram</h2>
      {n && <p className="mt-2 font-semibold" style={{ color: n.ok ? "var(--leaf)" : "var(--chili)" }}>{n.text}</p>}

      {!summary ? (
        <>
          <p className="mt-2">Connect your account to price with your real views and show brands your audience.</p>
          <p className="hint mt-1">Needs a Creator or Business account (free to switch in Instagram settings). We only read numbers; we never post.</p>
          {configured
            ? <a href="/api/instagram/connect" className="btn mt-5">Connect Instagram</a>
            : <p className="hint mt-4">Coming soon.</p>}
        </>
      ) : (
        <>
          <p className="mt-2 font-semibold">@{summary.username}</p>
          {summary.needsReconnect && (
            <p className="mt-2" style={{ color: "var(--chili)" }}>
              Instagram access expired. <a href="/api/instagram/connect" className="underline">Reconnect</a>
            </p>
          )}

          {stats ? (
            <>
              <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                <Stat label="Followers" value={compact(stats.followers)} />
                <Stat label="Typical views" value={stats.avgViews !== null ? compact(stats.avgViews) : "–"} />
                <Stat label="Engagement" value={stats.engagementRate !== null ? `${(stats.engagementRate * 100).toFixed(1)}%` : "–"} />
              </dl>
              <p className="hint mt-2">
                Typical views = middle value of your last {stats.reelsCounted} reels, so one viral reel doesn&apos;t skew it.
                Updated {new Date(stats.refreshedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.
              </p>

              {stats.audience && (
                <div className="mt-5"><AudienceBreakdown audience={stats.audience} /></div>
              )}

              <Link href="/rate" className="mt-5 inline-block font-semibold underline">Price a deal with these numbers →</Link>
            </>
          ) : (
            <p className="hint mt-3">No numbers yet. Tap refresh to pull them from Instagram.</p>
          )}

          <InstagramActions />
        </>
      )}
    </section>
  );
}

