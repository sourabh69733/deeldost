import { inr, shortDate } from "@/lib/format";
import { DELIVERABLES, NICHES } from "@/lib/pricing/config";
import type { Research } from "@/lib/people/research";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr]">
      <dt className="font-semibold">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const Chips = ({ items }: { items: string[] }) => (
  <span className="flex flex-wrap gap-1.5">
    {items.map((t) => <span key={t} className="rounded-full border px-2.5 py-0.5 text-sm" style={{ borderColor: "var(--line)", background: "var(--paper)" }}>{t}</span>)}
  </span>
);

export default function ResearchNote({ r }: { r: Research }) {
  return (
    <div className="space-y-4">
      {r.summary && <p>{r.summary}</p>}
      {r.pitch && (
        <p className="rounded-lg p-3" style={{ background: "#fff7e6", border: "1.5px solid var(--marigold)" }}>
          <strong>Pitch idea:</strong> {r.pitch}
        </p>
      )}
      <dl className="space-y-2">
        <Row label="Niche">{NICHES[r.niche].label} <span className="hint">({r.nicheSource === "ai" ? "AI" : "from keywords"})</span></Row>
        {r.themes.length > 0 && <Row label="Themes"><Chips items={r.themes} /></Row>}
        {r.audience && <Row label="Audience">{r.audience}</Row>}
        {r.location && <Row label="Location">{r.location}</Row>}
        {r.languages.length > 0 && <Row label="Languages">{r.languages.join(", ")}</Row>}
        {r.brands.length > 0 && <Row label="Brands seen"><Chips items={r.brands} /></Row>}
        {r.emails.length > 0 && (
          <Row label="Public email">
            {r.emails.map((e) => <a key={e} href={`mailto:${e}`} className="mr-3 underline">{e}</a>)}
          </Row>
        )}
        {r.rate && (
          <Row label="Rate guess">
            <strong>{r.rate.low === r.rate.high ? inr(r.rate.fair) : `${inr(r.rate.low)} to ${inr(r.rate.high)}`}</strong> per {DELIVERABLES[r.rate.deliverable].label.toLowerCase()}
            <span className="hint block">Assumes about {r.rate.assumedViews.toLocaleString("en-IN")} views. A starting point, not their real numbers.</span>
          </Row>
        )}
      </dl>
      <p className="hint">
        Researched {shortDate(r.researchedAt)}{r.usedAi ? " with AI" : " with rules only (AI unavailable)"}
        {r.sources.length ? `, read ${r.sources.length} page${r.sources.length > 1 ? "s" : ""}: ` : "."}
        {r.sources.map((s, i) => (
          <span key={s}>{i > 0 && ", "}<a href={s} target="_blank" rel="noopener noreferrer" className="underline break-all">{s.replace(/^https?:\/\/(www\.)?/, "")}</a></span>
        ))}
      </p>
    </div>
  );
}
