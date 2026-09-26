"use client";
import { useState } from "react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    const res = await fetch("/api/waitlist", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
    });
    if (res.ok) setState("done");
    else { setError((await res.json()).error ?? "Something went wrong"); setState("error"); }
  }

  if (state === "done") return <p className="font-semibold" style={{ color: "var(--leaf)" }}>You&apos;re on the list. We&apos;ll email you when the deal inbox opens.</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="wl-email" className="sr-only">Email</label>
      <input id="wl-email" type="email" required className="field sm:max-w-xs" placeholder="you@email.com"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="btn" disabled={state === "saving"}>{state === "saving" ? "Joining…" : "Join the waitlist"}</button>
      {state === "error" && <p className="text-sm" style={{ color: "var(--chili)" }}>{error}</p>}
    </form>
  );
}
