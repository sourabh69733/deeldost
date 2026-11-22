"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResearchButton({ id, again }: { id: string; again: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/people/${encodeURIComponent(id)}/research`, { method: "POST" });
      if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Research failed");
      else router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" className={again ? "btn btn-ghost" : "btn"} onClick={run} disabled={busy}>
        {busy ? "Researching… (up to a minute)" : again ? "Research again" : "Run research"}
      </button>
      {error && <span className="text-sm" style={{ color: "var(--chili)" }}>{error}</span>}
    </span>
  );
}
