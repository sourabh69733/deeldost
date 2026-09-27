"use client";
import { useState } from "react";
import type { AddOn, Deliverable, Niche } from "@/lib/pricing/config";

type Props = { deliverable: Deliverable; followers: number; avgViews: number; niche: Niche; addOns: AddOn[] };

const toNum = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;

// "What were you actually paid?" Anonymous numbers that help us calibrate prices.
export default function DealReportForm(props: Props) {
  const [paid, setPaid] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    try {
      const res = await fetch("/api/deal-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...props, paid: toNum(paid) }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error ?? "Something went wrong"); setState("error"); return; }
      const pct = Math.round(data.ratio * 100);
      setMessage(`Thanks! That's ${pct}% of our estimate. Reports like yours make prices more accurate for everyone.`);
      setState("done");
    } catch {
      setMessage("Couldn't reach the server. Try again."); setState("error");
    }
  }

  if (state === "done") return <p className="font-semibold" style={{ color: "var(--leaf)" }}>{message}</p>;

  return (
    <details>
      <summary className="cursor-pointer font-semibold">Done a deal like this? Tell us what you were paid</summary>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <p className="hint">Anonymous. We only save the numbers above and the amount, no name or handle.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="paid" className="sr-only">Amount paid in rupees</label>
          <input id="paid" inputMode="numeric" required className="field sm:max-w-[12rem]" placeholder="₹ amount paid"
            value={paid} onChange={(e) => setPaid(e.target.value)} />
          <button className="btn" disabled={state === "saving"}>{state === "saving" ? "Sending…" : "Send"}</button>
        </div>
        {state === "error" && <p className="text-sm" style={{ color: "var(--chili)" }}>{message}</p>}
      </form>
    </details>
  );
}
