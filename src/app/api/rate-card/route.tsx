// GET /api/rate-card?p=instagram&f=50000&v=15000&n=fashion&h=handle
// Returns a 1080x1350 PNG rate card (Instagram portrait size) to share with brands.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { compact, inr } from "@/lib/format";
import { NICHES } from "@/lib/pricing/config";
import { buildRateCard, parseRateCardQuery } from "@/lib/pricing/rate-card";

const INK = "#1b2240", PAPER = "#f7f8fa", MARIGOLD = "#f5a524", MUTED = "#5b6275", LINE = "#dde1ea";

// Fonts live in the repo (see next.config.mjs for deploy tracing). Hind's Devanagari file has the ₹ sign.
const fontDir = join(process.cwd(), "src/assets/fonts");
const fonts = Promise.all([
  readFile(join(fontDir, "hind-latin-400-normal.woff")),
  readFile(join(fontDir, "hind-latin-600-normal.woff")),
  readFile(join(fontDir, "hind-devanagari-600-normal.woff")),
  readFile(join(fontDir, "bricolage-grotesque-latin-800-normal.woff")),
]).then(([regular, semibold, rupee, display]) => [
  { name: "Hind", data: regular, weight: 400 as const },
  { name: "Hind", data: semibold, weight: 600 as const },
  { name: "HindRupee", data: rupee, weight: 600 as const },
  { name: "Bricolage", data: display, weight: 800 as const },
]);

export async function GET(req: Request) {
  const params = parseRateCardQuery(new URL(req.url).searchParams);
  if (!params) return new Response("Invalid rate card", { status: 400 });
  const card = buildRateCard(params);

  const title = card.handle ? `@${card.handle}` : "Rate card";
  const subtitle = `${NICHES[card.niche].label} creator on ${card.platform === "instagram" ? "Instagram" : "YouTube"}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: PAPER, color: INK, padding: 80, fontFamily: "Hind, HindRupee" }}>
        <div style={{ fontFamily: "Bricolage", fontSize: 76, lineHeight: 1.05 }}>{title}</div>
        <div style={{ fontSize: 36, color: MUTED, marginTop: 12 }}>{subtitle}</div>

        <div style={{ display: "flex", gap: 24, marginTop: 48 }}>
          {[["Followers", compact(card.followers)], ["Avg. views", compact(card.avgViews)]].map(([label, value]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", flex: 1, background: "#fff", border: `2px solid ${LINE}`, borderRadius: 20, padding: "24px 32px" }}>
              <div style={{ fontSize: 28, color: MUTED }}>{label}</div>
              <div style={{ fontFamily: "Bricolage", fontSize: 60 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 48, background: MARIGOLD, borderRadius: 28, padding: "20px 40px" }}>
          {card.rows.map((r, i) => (
            <div key={r.deliverable} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 0", borderTop: i ? "2px solid rgba(27,34,64,0.15)" : "none" }}>
              <div style={{ fontSize: 40, fontWeight: 600 }}>{r.label}</div>
              <div style={{ fontSize: 52, fontWeight: 600 }}>{inr(r.price)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 40, fontSize: 30 }}>
          {card.addOns.map((a) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <div>{a.label}</div>
              <div style={{ fontWeight: 600 }}>{`+${a.percent}%`}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", fontSize: 26, color: MUTED }}>
          <div>50% advance, 50% on posting · Rates exclude GST</div>
          <div style={{ fontWeight: 600, color: INK }}>DealDost</div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: await fonts,
      // Same query always gives the same image.
      headers: { "Cache-Control": "public, max-age=86400, immutable" },
    },
  );
}
