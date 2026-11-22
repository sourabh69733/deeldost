// GET /api/wrapped/card            the signed-in creator's own Wrapped
// GET /api/wrapped/card?u=handle   a public Wrapped
// GET /api/wrapped/card?demo=1     the sample
// Returns a 1080x1920 PNG (Instagram Story size) summing up the year.
import { ImageResponse } from "next/og";
import { compact } from "@/lib/format";
import { ogFonts } from "@/lib/server/og-fonts";
import { getCurrentUser } from "@/lib/server/session";
import type { Wrapped } from "@/lib/wrapped/compute";
import { MONTHS_LONG, PERSONAS } from "@/lib/wrapped/config";
import { DEMO_WRAPPED } from "@/lib/wrapped/demo";
import { getPublicWrapped, getWrapped } from "@/lib/wrapped/store";

const INK = "#1b2240", MARIGOLD = "#f5a524", PINK = "#ff6fa8", LILAC = "#b7a4ff", MINT = "#7ee0b5", SKY = "#7cc8ff";

async function load(q: URLSearchParams): Promise<{ w: Wrapped; cache: string } | null> {
  if (q.get("demo")) return { w: DEMO_WRAPPED, cache: "public, max-age=86400" };
  const u = q.get("u");
  if (u) {
    const p = await getPublicWrapped(u.toLowerCase());
    return p && { w: p.wrapped, cache: "public, max-age=600" };
  }
  const user = await getCurrentUser();
  const w = user && (await getWrapped(user.uid));
  return w ? { w, cache: "private, no-store" } : null;
}

export async function GET(req: Request) {
  const found = await load(new URL(req.url).searchParams).catch(() => null);
  if (!found) return new Response("Not found", { status: 404 });
  const { w, cache } = found;
  const persona = PERSONAS[w.persona];

  const tiles: [string, string, string][] = [
    [String(w.posts), "posts", MARIGOLD],
    [w.views !== null ? compact(w.views) : String(w.reels), w.views !== null ? "reel views" : "reels", PINK],
    [w.topReel ? compact(w.topReel.views) : compact(w.likes), w.topReel ? "on my top reel" : "likes", LILAC],
    [w.streakWeeks >= 2 ? `${w.streakWeeks} wks` : compact(w.comments), w.streakWeeks >= 2 ? "posting streak" : "comments", MINT],
  ];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: INK, color: "#fff", padding: "120px 80px 100px", fontFamily: "Hind" }}>
        <div style={{ fontSize: 44, color: MARIGOLD, fontWeight: 600 }}>{`@${w.username}`}</div>
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Bricolage", lineHeight: 0.92, marginTop: 24 }}>
          <div style={{ fontSize: 230, color: MARIGOLD }}>{String(w.year)}</div>
          <div style={{ fontSize: 150 }}>WRAPPED</div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, marginTop: 80 }}>
          {tiles.map(([value, label, bg]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", width: 446, background: bg, color: INK, borderRadius: 36, padding: "36px 40px" }}>
              <div style={{ fontFamily: "Bricolage", fontSize: 104, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 38, fontWeight: 600, marginTop: 8 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 28, background: SKY, color: INK, borderRadius: 36, padding: "36px 40px" }}>
          <div style={{ fontSize: 36, fontWeight: 600 }}>My creator type</div>
          <div style={{ fontFamily: "Bricolage", fontSize: 86, lineHeight: 1.05 }}>{persona.title}</div>
          {w.bestMonth !== null && <div style={{ fontSize: 36, marginTop: 8 }}>{`Best month: ${MONTHS_LONG[w.bestMonth]}`}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", fontSize: 38 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "rgba(255,255,255,0.7)" }}>Make yours free at</div>
            <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 60 }}>
              <span>Deal</span><span style={{ color: MARIGOLD }}>Dost</span>
            </div>
          </div>
          {w === DEMO_WRAPPED && <div style={{ background: "#fff", color: INK, borderRadius: 999, padding: "8px 28px", fontWeight: 600 }}>Sample</div>}
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts: await ogFonts, headers: { "Cache-Control": cache } },
  );
}
