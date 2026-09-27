"use client";
import { useEffect, useMemo, useState } from "react";
import { ADD_ONS, AddOn, DELIVERABLES, Deliverable, NICHES, Niche, Platform } from "@/lib/pricing/config";
import { calculateRate } from "@/lib/pricing/calculate";
import { inr } from "@/lib/format";
import { loadCreatorProfile, saveCreatorProfile } from "@/lib/creator-profile";

const toNum = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;

export default function RateCalculator() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [deliverable, setDeliverable] = useState<Deliverable>("reel");
  const [followers, setFollowers] = useState("");
  const [avgViews, setAvgViews] = useState("");
  const [niche, setNiche] = useState<Niche>("fashion");
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [copied, setCopied] = useState(false);

  const deliverables = (Object.keys(DELIVERABLES) as Deliverable[]).filter((d) => DELIVERABLES[d].platform === platform);
  const f = toNum(followers), v = toNum(avgViews);
  const ready = f > 0 && v > 0;

  // Prefill from this device, and remember changes for the brand checker.
  useEffect(() => {
    const saved = loadCreatorProfile();
    if (!saved) return;
    setFollowers(String(saved.followers));
    setAvgViews(String(saved.avgViews));
    setNiche(saved.niche);
  }, []);
  useEffect(() => {
    if (ready) saveCreatorProfile({ followers: f, avgViews: v, niche });
  }, [ready, f, v, niche]);

  const result = useMemo(
    () => (ready ? calculateRate({ deliverable, followers: f, avgViews: v, niche, addOns }) : null),
    [ready, deliverable, f, v, niche, addOns],
  );

  function switchPlatform(p: Platform) {
    setPlatform(p);
    setDeliverable(p === "instagram" ? "reel" : "yt_integration");
  }
  const toggleAddOn = (a: AddOn) => setAddOns((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));

  async function copyCard() {
    if (!result) return;
    const lines = [
      `Rate card — ${NICHES[niche].label} creator`,
      `${f.toLocaleString("en-IN")} followers · ${v.toLocaleString("en-IN")} avg views`,
      ``,
      `${DELIVERABLES[deliverable].label}: ${inr(result.fair)}`,
      ...addOns.map((a) => `+ ${ADD_ONS[a].label}`),
      ``,
      `Payment: 50% advance, 50% on posting. Rates exclude GST.`,
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
      <div className="space-y-6">
        <fieldset>
          <legend className="label">Platform</legend>
          <div className="flex gap-2">
            {(["instagram", "youtube"] as Platform[]).map((p) => (
              <button key={p} type="button" className="chip" aria-pressed={platform === p} onClick={() => switchPlatform(p)}>
                {p === "instagram" ? "Instagram" : "YouTube"}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">What will you make?</legend>
          <div className="flex flex-wrap gap-2">
            {deliverables.map((d) => (
              <button key={d} type="button" className="chip" aria-pressed={deliverable === d} onClick={() => setDeliverable(d)}>
                {DELIVERABLES[d].label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="followers" className="label">Followers</label>
            <input id="followers" inputMode="numeric" className="field" placeholder="50000"
              value={followers} onChange={(e) => setFollowers(e.target.value)} />
          </div>
          <div>
            <label htmlFor="views" className="label">Avg. views</label>
            <input id="views" inputMode="numeric" className="field" placeholder="15000"
              value={avgViews} onChange={(e) => setAvgViews(e.target.value)} />
          </div>
        </div>
        <p className="hint -mt-3">Use the average of your last 10 {platform === "instagram" ? "reels" : "videos"}.</p>

        <div>
          <label htmlFor="niche" className="label">Niche</label>
          <select id="niche" className="field" value={niche} onChange={(e) => setNiche(e.target.value as Niche)}>
            {(Object.keys(NICHES) as Niche[]).map((n) => <option key={n} value={n}>{NICHES[n].label}</option>)}
          </select>
        </div>

        <fieldset>
          <legend className="label">Is the brand asking for any of these?</legend>
          <div className="space-y-2">
            {(Object.keys(ADD_ONS) as AddOn[]).map((a) => (
              <label key={a} className="flex items-start gap-3">
                <input type="checkbox" className="mt-1.5 h-4 w-4 accent-[#1b2240]" checked={addOns.includes(a)} onChange={() => toggleAddOn(a)} />
                <span>{ADD_ONS[a].label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="md:pt-8" aria-live="polite">
        {result ? (
          <div key={`${result.fair}`} className="swing">
            <div className="tag">
              <p className="font-semibold">Fair price for this {DELIVERABLES[deliverable].label.toLowerCase()}</p>
              <p className="display mt-1 text-5xl font-extrabold">{inr(result.fair)}</p>
              <p className="mt-2 font-medium">Range {inr(result.low)} to {inr(result.high)}</p>
            </div>
            <p className="mt-5">{result.engagementNote}.</p>
            <p className="hint mt-2">{result.explanation}</p>
            {addOns.length === 0 && <p className="mt-3">If the brand wants to run your content as an ad, charge extra for usage rights.</p>}
            <button className="btn mt-6" onClick={copyCard}>{copied ? "Copied" : "Copy rate card"}</button>
            <p className="hint mt-6">Estimates only. Your real rate depends on your audience, content quality and the brand.</p>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed p-8" style={{ borderColor: "var(--line)" }}>
            <p className="font-semibold">Your price will show here.</p>
            <p className="hint mt-1">Enter followers and average views to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}
