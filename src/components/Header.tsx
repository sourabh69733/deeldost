import Link from "next/link";

export default function Header() {
  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
      <Link href="/" className="display text-xl font-extrabold">
        Deal<span style={{ color: "var(--marigold-deep)" }}>Dost</span>
      </Link>
      <nav className="flex gap-5 font-medium">
        <Link href="/rate" className="hover:underline">My rate</Link>
        <Link href="/check" className="hover:underline">Check a brand</Link>
      </nav>
    </header>
  );
}
