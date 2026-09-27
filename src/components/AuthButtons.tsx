"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle, signOut } from "@/lib/auth/client";

export function SignInButton({ className = "btn", label = "Sign in with Google" }: { className?: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setBusy(true); setError("");
    try {
      await signInWithGoogle();
      router.refresh();
    } catch (e) {
      // Closing the popup is not an error worth showing.
      const code = (e as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError(e instanceof Error && !code ? e.message : "Sign-in didn't work. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" className={className} onClick={onClick} disabled={busy}>{busy ? "Signing in…" : label}</button>
      {error && <span className="text-sm" style={{ color: "var(--chili)" }}>{error}</span>}
    </span>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <button type="button" className="btn btn-ghost" onClick={async () => { await signOut(); router.push("/"); router.refresh(); }}>
      Sign out
    </button>
  );
}
