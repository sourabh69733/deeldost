import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 border-t px-5 py-8 text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
      <span>Estimates and signals, not guarantees.</span>
      <Link href="/privacy" className="hover:underline">Privacy</Link>
      <Link href="/terms" className="hover:underline">Terms</Link>
    </footer>
  );
}
