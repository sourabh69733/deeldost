"use client";
import { useEffect, useState } from "react";

/** Makes an extension key and shows it once, with the server address to paste next to it. */
export default function ExtensionKey() {
  const [token, setToken] = useState("");
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  async function make() {
    if (token || !confirm("Make a new key? Your old key will stop working.")) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/capture-token", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Couldn't make a key");
      else setToken(data.token);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label); setTimeout(() => setCopied(""), 2000);
  }

  return (
    <div className="mt-3 space-y-3">
      {!token ? (
        <button type="button" className="btn btn-ghost" onClick={make} disabled={busy}>{busy ? "Making…" : "Make extension key"}</button>
      ) : (
        <>
          <p className="hint">Paste these into the extension. The key is shown only once.</p>
          {[["Server", origin], ["Key", token]].map(([label, value]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-14 shrink-0 font-semibold">{label}</span>
              <code className="min-w-0 flex-1 truncate rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--line)", background: "#fff" }}>{value}</code>
              <button type="button" className="btn btn-ghost shrink-0" onClick={() => copy(label, value)}>{copied === label ? "Copied" : "Copy"}</button>
            </div>
          ))}
        </>
      )}
      {error && <p className="text-sm" style={{ color: "var(--chili)" }}>{error}</p>}
    </div>
  );
}
