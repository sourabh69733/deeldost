"use client";
import { useEffect, useState } from "react";
import { PAGE_REF_KEY } from "@/lib/auth/client";

const send = (slug: string, type: "view" | "click") =>
  fetch(`/api/p/${slug}/event`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }), keepalive: true }).catch(() => {});

/** Counts the visit (not for the admin), remembers the page for this tab so a sign-up can be linked to it. */
export function PageVisit({ slug, track }: { slug: string; track: boolean }) {
  useEffect(() => {
    try {
      sessionStorage.setItem(PAGE_REF_KEY, slug);
    } catch {
      /* storage blocked: sign-up just won't be linked */
    }
    if (track) send(slug, "view");
  }, [slug, track]);
  return null;
}

/** A link that also counts a click. */
export function TrackedLink({ slug, track, href, className, style, children }: {
  slug: string; track: boolean; href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode;
}) {
  return <a href={href} className={className} style={style} onClick={() => { if (track) send(slug, "click"); }}>{children}</a>;
}

export function RemovePageButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function remove() {
    if (!confirm("Remove this page? The link will stop working and we won't contact you again.")) return;
    setState("busy");
    try {
      const res = await fetch(`/api/p/${slug}/remove`, { method: "POST" });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <p className="font-semibold">Done. This page is removed and we won&apos;t contact you again.</p>;
  return (
    <span>
      <button type="button" className="font-semibold underline" onClick={remove} disabled={state === "busy"}>
        {state === "busy" ? "Removing…" : "Remove this page"}
      </button>
      {state === "error" && <span className="ml-2" style={{ color: "var(--chili)" }}>Couldn&apos;t remove it. Please try again.</span>}
    </span>
  );
}
