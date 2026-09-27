import { getCurrentUser } from "@/lib/server/session";
import { igAppConfig } from "@/lib/instagram/config";
import { getStats, getSummary } from "@/lib/instagram/store";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";
import InstagramCard from "@/components/InstagramCard";
import KitSettingsForm from "@/components/KitSettingsForm";
import { getKitSettings } from "@/lib/kit/store";

export const metadata = { title: "Account — DealDost" };

export default async function AccountPage({ searchParams }: { searchParams: { ig?: string } }) {
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

  const [summary, stats, kit] = await Promise.all([getSummary(user.uid), getStats(user.uid), getKitSettings(user.uid)]);

  return (
    <section className="pt-6">
      <h1 className="text-4xl font-extrabold">Hi{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
      <p className="mt-2" style={{ color: "var(--muted)" }}>{user.email}</p>

      <InstagramCard configured={!!igAppConfig()} summary={summary} stats={stats} notice={searchParams.ig} />

      {summary && stats?.avgViews ? (
        <section className="mt-10 rounded-xl border-2 p-6" style={{ borderColor: "var(--line)", background: "#fff" }}>
          <h2 className="text-xl font-bold">Media kit</h2>
          <p className="mt-1">A one-page link for brands with your real numbers, audience and rates.</p>
          <KitSettingsForm initial={kit} username={summary.username} />
        </section>
      ) : null}

      <div className="mt-10"><SignOutButton /></div>
    </section>
  );
}
