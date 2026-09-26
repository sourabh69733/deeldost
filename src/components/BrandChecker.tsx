"use client";
import { useState } from "react";
import type { BrandCheckResult as Result } from "@/lib/brand-check/types";

const VERDICT = {
  low: { title: "Looks OK", body: "No major warning signs. Still get the deal in writing.", color: "var(--leaf)", dot: "🟢" },
  medium: { title: "Be careful", body: "Some things don't add up. Ask the questions below before agreeing.", color: "var(--marigold-deep)", dot: "🟡" },
  high: { title: "Likely scam", body: "Strong scam signals. Don't pay anything or share personal details.", color: "var(--chili)", dot: "🔴" },
};

export default function BrandChecker() {
  const [form, setForm] = useState({ brandName: "", website: "", instagram: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/check-brand", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
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
            <label htmlFor="brand" className="label">Brand name</label>
            <input id="brand" required className="field" value={form.brandName} onChange={set("brandName")} />
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
          <label htmlFor="msg" className="label">Their message</label>
          <textarea id="msg" required rows={7} className="field" value={form.message} onChange={set("message")}
            placeholder="Paste the full DM, WhatsApp message or email here" />
        </div>
        <button className="btn" disabled={loading}>{loading ? "Checking…" : "Check this brand"}</button>
        {error && <p style={{ color: "var(--chili)" }}>{error}</p>}
      </form>

      {result && (
        <section aria-live="polite" className="border-t pt-8" style={{ borderColor: "var(--line)" }}>
          <p className="display text-3xl font-extrabold" style={{ color: VERDICT[result.risk].color }}>
            {VERDICT[result.risk].dot} {VERDICT[result.risk].title}
          </p>
          <p className="mt-2">{VERDICT[result.risk].body}</p>

          {reasons.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-bold">What we noticed</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">{reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </>
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
