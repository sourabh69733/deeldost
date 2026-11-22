"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddPersonForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/people", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: data.error ?? "Couldn't save" }); return; }
      setMsg({ ok: true, text: data.created ? "Saved." : "Already saved, moved to the top." });
      setUrl("");
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "Couldn't reach the server." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3">
      <label htmlFor="add-url" className="label">Add by link</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="add-url" className="field" placeholder="instagram.com/handle, YouTube, X, LinkedIn or a website"
          value={url} onChange={(e) => setUrl(e.target.value)} required />
        <button className="btn shrink-0" disabled={busy || !url.trim()}>{busy ? "Saving…" : "Save"}</button>
      </div>
      {msg && <p className="mt-1 text-sm" style={{ color: msg.ok ? "var(--muted)" : "var(--chili)" }}>{msg.text}</p>}
    </form>
  );
}
