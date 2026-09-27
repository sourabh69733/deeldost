import { getCurrentUser } from "@/lib/server/session";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";

export const metadata = { title: "Account — DealDost" };

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <section className="pt-6">
        <h1 className="text-4xl font-extrabold">Your account</h1>
        <p className="mt-3 mb-6 max-w-xl" style={{ color: "var(--muted)" }}>
          Sign in to connect Instagram, use your real numbers for pricing, and get a media kit to send brands.
          The free tools work without an account.
        </p>
        <SignInButton />
      </section>
    );
  }

  return (
    <section className="pt-6">
      <h1 className="text-4xl font-extrabold">Hi{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
      <p className="mt-2" style={{ color: "var(--muted)" }}>{user.email}</p>

      <div className="mt-10 rounded-xl border-2 border-dashed p-6" style={{ borderColor: "var(--line)" }}>
        <h2 className="text-xl font-bold">Instagram</h2>
        <p className="hint mt-1">Coming soon: connect your account to price with your real reach and audience.</p>
      </div>

      <div className="mt-10"><SignOutButton /></div>
    </section>
  );
}
