"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Drafts } from "@/lib/outreach/message";
import type { PersonPage } from "@/lib/people/person";
import type { Status } from "@/lib/people/config";
import { shortDate } from "@/lib/format";

type Props = { id: string; page: PersonPage | null; optedOut: boolean; status: Status; pageUrl: string | null; drafts: Drafts | null };

export default function PersonalPagePanel({ id, page, optedOut, status, pageUrl, drafts }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function call(url: string, method: string, body?: object) {
    setBusy(true); setError("");
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "Something went wrong");
      else router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }
  const pageApi = `/api/admin/people/${encodeURIComponent(id)}/page`;

  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label); setTimeout(() => setCopied(""), 2000);
  }

  if (optedOut) return <p className="hint">They removed their page. Don&apos;t contact them again.</p>;

  if (!page || !pageUrl || !drafts) {
    return (
      <div className="space-y-2">
        <p className="hint">A private page for them with a rate card for their size, 3 tips and a link to sign up. Only people with the link can see it, and they can remove it.</p>
        <button type="button" className="btn" onClick={() => call(pageApi, "POST")} disabled={busy}>{busy ? "Making…" : "Make page"}</button>
        {error && <p className="text-sm" style={{ color: "var(--chili)" }}>{error}</p>}
      </div>
    );
  }

  const blocks: [string, string][] = [["DM", drafts.dm], ["Email subject", drafts.emailSubject], ["Email", drafts.emailBody]];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="break-all font-semibold underline">{pageUrl}</a>
        <button type="button" className="btn btn-ghost !py-1.5" onClick={() => copy("link", pageUrl)}>{copied === "link" ? "Copied" : "Copy link"}</button>
      </div>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        {page.views} view{page.views === 1 ? "" : "s"} · {page.clicks} button click{page.clicks === 1 ? "" : "s"}
        {page.lastViewAt ? ` · last seen ${shortDate(page.lastViewAt)}` : ""}
        {page.signedUpAt ? ` · signed up ${shortDate(page.signedUpAt)} 🎉` : ""}
      </p>

      <div>
        <h3 className="font-bold">First message</h3>
        <p className="hint">Copy and send it yourself from your own account. Edit it to sound like you.</p>
        <div className="mt-2 space-y-3">
          {blocks.map(([label, text]) => (
            <div key={label}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{label}</span>
                <button type="button" className="text-sm font-semibold underline" onClick={() => copy(label, text)}>{copied === label ? "Copied" : "Copy"}</button>
              </div>
              <pre className="mt-1 whitespace-pre-wrap rounded-lg border p-3 font-sans text-sm" style={{ borderColor: "var(--line)", background: "var(--paper)" }}>{text}</pre>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {(status === "saved" || status === "researched" || status === "page_ready") && (
          <button type="button" className="btn" onClick={() => call(`/api/admin/people/${encodeURIComponent(id)}`, "PATCH", { status: "contacted" })} disabled={busy}>
            I sent it: mark as contacted
          </button>
        )}
        <button type="button" className="text-sm font-semibold underline" style={{ color: "var(--chili)" }} disabled={busy}
          onClick={() => { if (confirm("Turn off this page? The link will stop working.")) call(pageApi, "DELETE"); }}>
          Turn off page
        </button>
      </div>
      {error && <p className="text-sm" style={{ color: "var(--chili)" }}>{error}</p>}
    </div>
  );
}
