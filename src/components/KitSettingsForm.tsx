"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NICHES, type Niche } from "@/lib/pricing/config";
import { kitPath, type KitSettings } from "@/lib/kit/settings";

export default function KitSettingsForm({ initial, username }: { initial: KitSettings; username: string }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function save(next: KitSettings) {
    setSettings(next); setBusy(true); setError("");
    try {
      const res = await fetch("/api/kit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Couldn't save"); setSettings(settings); }
      router.refresh();
    } catch {
      setError("Couldn't reach the server."); setSettings(settings);
    } finally {
      setBusy(false);
    }
  }

  // Full URL needs the browser's origin; set after mount so server and client render the same first.
  const [url, setUrl] = useState(kitPath(username));
  useEffect(() => setUrl(`${window.location.origin}${kitPath(username)}`), [username]);

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label htmlFor="kit-niche" className="label">Your niche</label>
        <select id="kit-niche" className="field sm:max-w-xs" value={settings.niche} disabled={busy}
          onChange={(e) => save({ ...settings, niche: e.target.value as Niche })}>
          {(Object.keys(NICHES) as Niche[]).map((n) => <option key={n} value={n}>{NICHES[n].label}</option>)}
        </select>
      </div>

      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1.5 h-4 w-4 accent-[#1b2240]" checked={settings.public} disabled={busy}
          onChange={(e) => save({ ...settings, public: e.target.checked })} />
        <span>
          <strong>Public link</strong>
          <span className="hint block">Anyone with the link can see your numbers, audience and rates. Not listed on Google.</span>
        </span>
      </label>

      {settings.public && (
        <div className="flex flex-wrap items-center gap-3">
          <a href={kitPath(username)} className="font-semibold underline break-all" target="_blank">{url}</a>
          <button type="button" className="btn btn-ghost" onClick={async () => {
            await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000);
          }}>{copied ? "Copied" : "Copy link"}</button>
        </div>
      )}
      {error && <p className="text-sm" style={{ color: "var(--chili)" }}>{error}</p>}
    </div>
  );
}
