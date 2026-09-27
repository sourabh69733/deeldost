"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InstagramActions() {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "refresh" | "disconnect">("");
  const [error, setError] = useState("");

  async function post(action: "refresh" | "disconnect") {
    if (action === "disconnect" && !confirm("Disconnect Instagram? We'll delete your saved Instagram numbers.")) return;
    setBusy(action); setError("");
    try {
      const res = await fetch(`/api/instagram/${action}`, { method: "POST" });
      if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Something went wrong");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn" disabled={!!busy} onClick={() => post("refresh")}>
          {busy === "refresh" ? "Refreshing…" : "Refresh numbers"}
        </button>
        <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => post("disconnect")}>
          {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm" style={{ color: "var(--chili)" }}>{error}</p>}
    </div>
  );
}
