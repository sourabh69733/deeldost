import Link from "next/link";
import { getCurrentUser } from "@/lib/server/session";
import { SignInButton } from "./AuthButtons";

export default async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-5">
      <Link href="/" className="display text-xl font-extrabold">
        Deal<span style={{ color: "var(--marigold-deep)" }}>Dost</span>
      </Link>
      <nav className="flex items-center gap-5 font-medium">
        <Link href="/rate" className="hover:underline">My rate</Link>
        <Link href="/check" className="hover:underline">Check a brand</Link>
        {user
          ? <Link href="/account" className="hover:underline">Account</Link>
          : <SignInButton className="hover:underline" label="Sign in" />}
      </nav>
    </header>
  );
}
