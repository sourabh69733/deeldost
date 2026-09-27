"use client";
import { useEffect, useState } from "react";
import type { BrandCheckResult as Result } from "@/lib/brand-check/types";
import { compressImage } from "@/lib/image";
import { inr } from "@/lib/format";
import { loadCreatorProfile, saveCreatorProfile } from "@/lib/creator-profile";
import { DELIVERABLES, NICHES, type Niche } from "@/lib/pricing/config";
import type { PayCheck } from "@/lib/brand-check/pay-check";
import type { InstagramNumbers } from "@/lib/instagram/numbers";

type Shot = { name: string; mediaType: "image/jpeg"; data: string };

const toNum = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;

const PAY_VERDICT: Record<PayCheck["verdict"], { title: string; tip: string; color: string }> = {
  low: { title: "Low offer", tip: "You can ask for more. Share your rate card and quote the fair price.", color: "var(--chili)" },
  fair: { title: "Fair offer", tip: "This is in your range. Get it in writing before you start.", color: "var(--leaf)" },
  high: { title: "Good offer", tip: "Above your usual range. Great, as long as the brand checks out.", color: "var(--leaf)" },
  too_good: { title: "Too good to be true?", tip: "Pay this high is often bait. Never pay anything upfront to get it.", color: "var(--marigold-deep)" },
};

const VERDICT = {
  low: { title: "Looks OK", body: "No major warning signs. Still get the deal in writing.", color: "var(--leaf)", dot: "🟢" },
  medium: { title: "Be careful", body: "Some things don't add up. Ask the questions below before agreeing.", color: "var(--marigold-deep)", dot: "🟡" },
  high: { title: "Likely scam", body: "Strong scam signals. Don't pay anything or share personal details.", color: "var(--chili)", dot: "🔴" },
};

export default function BrandChecker({ instagram }: { instagram?: InstagramNumbers | null }) {
  const [form, setForm] = useState({ brandName: "", website: "", instagram: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [shot, setShot] = useState<Shot | null>(null);
  const [stats, setStats] = useState({ followers: "", avgViews: "", niche: "fashion" as Niche });

  // Prefill: real Instagram numbers first, else what this device remembers.
  useEffect(() => {
    const saved = loadCreatorProfile();
    const source = instagram ?? saved;
    if (source) setStats({ followers: String(source.followers), avgViews: String(source.avgViews), niche: saved?.niche ?? "fashion" });
  }, [instagram]);

  const creator = toNum(stats.followers) > 0 && toNum(stats.avgViews) > 0
    ? { followers: toNum(stats.followers), avgViews: toNum(stats.avgViews), niche: stats.niche }
    : undefined;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function pickScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setShot({ name: file.name, ...(await compressImage(file)) });
      setError("");
    } catch {
      setError("Couldn't open that image. Try a PNG or JPG screenshot.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    if (creator) saveCreatorProfile(creator);
    try {
      const res = await fetch("/api/check-brand", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          ...form,
          screenshot: shot ? { mediaType: shot.mediaType, data: shot.data } : undefined,
          creator,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Check failed. Try again.");
      else setResult(data);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const reasons = result ? [...result.flags.map((f) => f.reason), ...(result.domain?.notes ?? []), ...result.aiReasons] : [];

  return (
    <div className="space-y-10">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="brand" className="label">Brand name {shot && <span className="hint">(optional)</span>}</label>
            <input id="brand" required={!shot} className="field" value={form.brandName} onChange={set("brandName")} />
          </div>
          <div>
            <label htmlFor="site" className="label">Website <span className="hint">(optional)</span></label>
            <input id="site" className="field" placeholder="brand.com" value={form.website} onChange={set("website")} />
          </div>
          <div>
            <label htmlFor="ig" className="label">Instagram <span className="hint">(optional)</span></label>
            <input id="ig" className="field" placeholder="@brand" value={form.instagram} onChange={set("instagram")} />
          </div>
        </div>
        <div>
          <label htmlFor="msg" className="label">Their message {shot && <span className="hint">(optional)</span>}</label>
          <textarea id="msg" required={!shot} rows={7} className="field" value={form.message} onChange={set("message")}
            placeholder="Paste the full DM, WhatsApp message or email here" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="hint">or</span>
          <label className="btn btn-ghost cursor-pointer">
            {shot ? "Change screenshot" : "Upload a screenshot"}
            <input type="file" accept="image/*" className="sr-only" onChange={pickScreenshot} />
          </label>
          {shot && (
            <span className="hint">
              {shot.name} <button type="button" className="underline" onClick={() => setShot(null)}>remove</button>
            </span>
          )}
        </div>
        <details open={!creator}>
          <summary className="cursor-pointer font-semibold">
            Your numbers <span className="hint">(optional, to check if the pay is fair)</span>
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="cc-followers" className="label">Followers</label>
              <input id="cc-followers" inputMode="numeric" className="field" placeholder="50000"
                value={stats.followers} onChange={(e) => setStats({ ...stats, followers: e.target.value })} />
            </div>
            <div>
              <label htmlFor="cc-views" className="label">Avg. views</label>
              <input id="cc-views" inputMode="numeric" className="field" placeholder="15000"
                value={stats.avgViews} onChange={(e) => setStats({ ...stats, avgViews: e.target.value })} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="cc-niche" className="label">Niche</label>
              <select id="cc-niche" className="field" value={stats.niche}
                onChange={(e) => setStats({ ...stats, niche: e.target.value as Niche })}>
                {(Object.keys(NICHES) as Niche[]).map((n) => <option key={n} value={n}>{NICHES[n].label}</option>)}
              </select>
            </div>
          </div>
        </details>
        <button className="btn" disabled={loading}>{loading ? "Checking…" : "Check this brand"}</button>
        {error && <p style={{ color: "var(--chili)" }}>{error}</p>}
      </form>

      {result && (
        <section aria-live="polite" className="border-t pt-8" style={{ borderColor: "var(--line)" }}>
          <p className="display text-3xl font-extrabold" style={{ color: VERDICT[result.risk].color }}>
            {VERDICT[result.risk].dot} {VERDICT[result.risk].title}
          </p>
          <p className="mt-2">{VERDICT[result.risk].body}</p>

          {result.payCheck ? (
            <div className="mt-8 rounded-xl border-2 p-5" style={{ borderColor: PAY_VERDICT[result.payCheck.verdict].color }}>
              <h2 className="text-xl font-bold" style={{ color: PAY_VERDICT[result.payCheck.verdict].color }}>
                {PAY_VERDICT[result.payCheck.verdict].title}
              </h2>
              <p className="mt-2">
                They offer <strong>{inr(result.payCheck.offered)}</strong>. For a {DELIVERABLES[result.payCheck.deliverable].label.toLowerCase()} at
                your size, a fair price is <strong>{inr(result.payCheck.fair)}</strong> ({inr(result.payCheck.low)} to {inr(result.payCheck.high)}).
              </p>
              <p className="mt-2">{PAY_VERDICT[result.payCheck.verdict].tip}</p>
            </div>
          ) : result.offeredAmount ? (
            <p className="mt-8">
              They offer <strong>{inr(result.offeredAmount)}</strong>. Add your numbers above to see if that&apos;s fair.
            </p>
          ) : null}

          {reasons.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-bold">What we noticed</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">{reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </>
          )}

          {result.readFromScreenshot && (
            <details className="mt-6">
              <summary className="cursor-pointer font-semibold">What we read from your screenshot</summary>
              <p className="hint mt-2 whitespace-pre-wrap">{result.readFromScreenshot}</p>
            </details>
          )}

          {result.domain && (
            <p className="hint mt-4">
              {result.domain.domain}: {result.domain.reachable ? "website loads" : "website did not load"}
              {result.domain.ageDays !== null && `, domain is about ${Math.round(result.domain.ageDays / 30)} months old`}.
            </p>
          )}

          <h2 className="mt-8 text-xl font-bold">Ask the brand before saying yes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">{result.questions.map((q, i) => <li key={i}>{q}</li>)}</ul>

          {result.aiError && <p className="hint mt-6">{result.aiError}</p>}
          <p className="hint mt-6">These are signals, not proof. When unsure, don&apos;t pay anything and ask for a written agreement.</p>
        </section>
      )}
    </div>
  );
}
