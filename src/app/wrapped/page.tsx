import { SignInButton } from "@/components/AuthButtons";
import WrappedHub from "@/components/wrapped/WrappedHub";
import WrappedLauncher from "@/components/wrapped/WrappedLauncher";
import { igAppConfig } from "@/lib/instagram/config";
import { getSummary } from "@/lib/instagram/store";
import { getCurrentUser } from "@/lib/server/session";
import { wrappedYear } from "@/lib/wrapped/compute";
import { DEMO_WRAPPED } from "@/lib/wrapped/demo";
import { getWrapped, getWrappedSettings } from "@/lib/wrapped/store";

export const metadata = {
  title: "Your Instagram Wrapped — DealDost",
  description: "Your year on Instagram as a story you can share: posts, views, best reel and your creator type. Free for creators.",
  openGraph: { images: [{ url: "/api/wrapped/card?demo=1", width: 1080, height: 1920 }] },
};

const INCLUDED = ["📈 Total reel views", "🏆 Your top reel", "📅 Best month", "🔥 Posting streak", "✨ Your creator type", "📲 Story-ready image"];

export default async function WrappedPage() {
  const year = wrappedYear();
  const user = await getCurrentUser();
  const summary = user ? await getSummary(user.uid).catch(() => null) : null;
  const [mine, settings] = user && summary
    ? await Promise.all([getWrapped(user.uid, year), getWrappedSettings(user.uid)])
    : [null, null];

  return (
    <>
      <section className="pt-8 pb-10">
        <p className="inline-block rounded-full px-3 py-1 text-sm font-semibold" style={{ background: "var(--marigold)" }}>New · free for creators</p>
        <h1 className="mt-4 text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl">Your {year} on Instagram, Wrapped.</h1>
        <p className="mt-4 max-w-xl text-lg" style={{ color: "var(--muted)" }}>
          Your posts, views, biggest reel and creator type, as a story you can post. Made from your own account, in one tap.
        </p>
        <ul className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
          {INCLUDED.map((x) => <li key={x} className="rounded-full border-2 bg-white px-3 py-1" style={{ borderColor: "var(--line)" }}>{x}</li>)}
        </ul>
      </section>

      <section id="make" className="scroll-mt-6 border-t py-10" style={{ borderColor: "var(--line)" }}>
        <h2 className="mb-5 text-2xl font-bold">{mine ? "Your Wrapped" : "Make yours"}</h2>
        {user && summary && settings ? (
          <WrappedHub wrapped={mine} settings={settings} username={summary.username} picture={summary.picture} />
        ) : (
          <div className="rounded-2xl border-2 p-6" style={{ borderColor: "var(--line)", background: "#fff" }}>
            <ol className="space-y-2">
              <li><strong>1.</strong> Sign in with Google.</li>
              <li><strong>2.</strong> Connect Instagram (Creator or Business account, free to switch).</li>
              <li><strong>3.</strong> Tap &quot;Make my Wrapped&quot; and share it.</li>
            </ol>
            <div className="mt-5">
              {!user && <SignInButton label="Sign in to start" />}
              {user && (igAppConfig()
                ? <a href="/api/instagram/connect" className="btn">Connect Instagram</a>
                : <p className="hint">Instagram connect opens soon. Try the sample below meanwhile.</p>)}
            </div>
            <p className="hint mt-4">We only read numbers. We never post for you. Your Wrapped stays private unless you turn on its link.</p>
          </div>
        )}
      </section>

      <section className="border-t py-10" style={{ borderColor: "var(--line)" }}>
        <h2 className="text-2xl font-bold">See a sample first</h2>
        <p className="mt-2 mb-5" style={{ color: "var(--muted)" }}>Made-up numbers, real experience. Tap to play.</p>
        <WrappedLauncher wrapped={DEMO_WRAPPED} picture={null} mode="demo" cardUrl="/api/wrapped/card?demo=1" label="Play sample" />
      </section>
    </>
  );
}
