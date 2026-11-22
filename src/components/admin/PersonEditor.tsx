"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUSES, STATUS_KEYS, type Status } from "@/lib/people/config";

export default function PersonEditor({ id, status: initialStatus, notes: initialNotes }: { id: string; status: Status; notes: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(method: "PATCH" | "DELETE", body?: object) {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/admin/people/${encodeURIComponent(id)}`, {
        method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: data.error ?? "Couldn't save" }); return false; }
      return true;
    } catch {
      setMsg({ ok: false, text: "Couldn't reach the server." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(next: Status) {
    const prev = status;
    setStatus(next);
    if (await send("PATCH", { status: next })) router.refresh();
    else setStatus(prev);
  }

  async function saveNotes() {
    if (await send("PATCH", { notes })) { setMsg({ ok: true, text: "Notes saved." }); router.refresh(); }
  }

  async function remove() {
    if (!confirm("Delete this person and everything saved about them?")) return;
    if (await send("DELETE")) { router.push("/admin"); router.refresh(); }
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="p-status" className="label">Status</label>
        <select id="p-status" className="field sm:max-w-xs" value={status} disabled={busy} onChange={(e) => changeStatus(e.target.value as Status)}>
          {STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUSES[s]}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="p-notes" className="label">Notes</label>
        <textarea id="p-notes" className="field min-h-32" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything useful: how you found them, brands they work with, what to pitch." />
        <button type="button" className="btn mt-2" onClick={saveNotes} disabled={busy || notes === initialNotes}>Save notes</button>
      </div>
      {msg && <p className="text-sm" style={{ color: msg.ok ? "var(--muted)" : "var(--chili)" }}>{msg.text}</p>}
      <button type="button" className="text-sm font-semibold underline" style={{ color: "var(--chili)" }} onClick={remove} disabled={busy}>Delete person</button>
    </div>
  );
}
