"use client";
// The creator's own Wrapped: make it, play it, share it, and choose whether the link is public.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics/track";
import { shareImage } from "@/lib/share-image";
import type { Wrapped } from "@/lib/wrapped/compute";
import { wrappedCardPath, wrappedPath, type WrappedSettings } from "@/lib/wrapped/settings";
import WrappedLauncher from "./WrappedLauncher";

type Props = { wrapped: Wrapped | null; settings: WrappedSettings; username: string; picture: string | null };

export default function WrappedHub({ wrapped, settings: initial, username, picture }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "make" | "share" | "settings">("");
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(initial);
  const [copied, setCopied] = useState(false);
  // Full URL needs the browser's origin; set after mount so server and client render the same first.
  const [url, setUrl] = useState(wrappedPath(username));
  useEffect(() => setUrl(`${window.location.origin}${wrappedPath(username)}`), [username]);

  async function post(path: string, body?: unknown): Promise<boolean> {
    setError("");
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Something went wrong"); return false; }
      return true;
    } catch {
      setError("Couldn't reach the server. Try again.");
      return false;
    }
  }

  async function make() {
    setBusy("make");
    if (await post("/api/wrapped")) router.refresh();
    setBusy("");
  }

  async function togglePublic(next: boolean) {
    setBusy("settings");
    setSettings({ public: next });
    if (!(await post("/api/wrapped/settings", { public: next }))) setSettings({ public: !next });
    setBusy("");
  }

  async function share() {
    setBusy("share");
    if (await shareImage(wrappedCardPath(), `wrapped-${wrapped?.year}.png`, "My Wrapped")) track("wrapped_shared");
    setBusy("");
  }

  if (!wrapped) {
    return (
      <div className="rounded-2xl border-2 p-6" style={{ borderColor: "var(--line)", background: "#fff" }}>
        <p className="font-semibold">Ready, @{username}?</p>
        <p className="hint mt-1">We read this year&apos;s posts and views from Instagram. Takes about 20 seconds.</p>
        <button type="button" className="btn mt-4" onClick={make} disabled={!!busy}>{busy === "make" ? "Wrapping your year…" : "Make my Wrapped"}</button>
        {error && <p className="mt-2 text-sm" style={{ color: "var(--chili)" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-start">
      <WrappedLauncher wrapped={wrapped} picture={picture} mode="own" cardUrl={wrappedCardPath()} publicUrl={settings.public ? url : null} />

      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn" onClick={share} disabled={!!busy}>{busy === "share" ? "Making image…" : "Share to your Story"}</button>
          <button type="button" className="btn btn-ghost" onClick={make} disabled={!!busy}>{busy === "make" ? "Updating…" : "Update numbers"}</button>
        </div>
        <p className="hint">Made {new Date(wrapped.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}. Post the image to your Story and tag a friend who should make theirs.</p>

        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1.5 h-4 w-4 accent-[#1b2240]" checked={settings.public} disabled={!!busy}
            onChange={(e) => togglePublic(e.target.checked)} />
          <span>
            <strong>Public link</strong>
            <span className="hint block">Anyone with the link can play your Wrapped. Not listed on Google. Turn off any time.</span>
          </span>
        </label>
        {settings.public && (
          <div className="flex flex-wrap items-center gap-3">
            <a href={wrappedPath(username)} className="font-semibold underline break-all" target="_blank">{url}</a>
            <button type="button" className="btn btn-ghost" onClick={async () => {
              await navigator.clipboard.writeText(url).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000);
            }}>{copied ? "Copied" : "Copy link"}</button>
          </div>
        )}
        {error && <p className="text-sm" style={{ color: "var(--chili)" }}>{error}</p>}
      </div>
    </div>
  );
}
